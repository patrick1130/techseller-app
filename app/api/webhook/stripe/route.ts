import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import configFile from "@/config";
import User from "@/models/User";
import { findCheckoutSession } from "@/libs/stripe";

const UserModel = User as any;
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-08-16",
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// This is where we receive Stripe webhook events
// It's used to update user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  await connectMongo();

  const body = await req.text();

  const signature = (await headers()).get("stripe-signature") as string;

  let eventType;
  let event;

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer;
        const priceId = session?.line_items?.data[0]?.price.id;
        const userId = stripeObject.client_reference_id;
        const plan = configFile.stripe.plans.find((p: any) => p.priceId === priceId);

        if (!plan) break;

        const customer = (await stripe.customers.retrieve(
          customerId as string
        )) as Stripe.Customer;

        let user;

        // Get or create the user. userId is normally passed in the checkout session (clientReferenceID) to identify the user when we get the webhook event
        if (userId) {
          user = await UserModel.findById(userId);
        } else if (customer.email) {
          user = await UserModel.findOne({ email: customer.email });

          if (!user) {
            user = await UserModel.create({
              email: customer.email,
              name: customer.name,
            });

            await user.save();
          }
        } else {
          console.error("No user found");
          throw new Error("No user found");
        }

        // Update user data + Grant user access to your product.
        user.priceId = priceId;
        user.customerId = customerId;
        user.hasAccess = true; // 保留向下兼容

        // ================= [ 修复：首次付款充值逻辑 ] =================
        const STRIPE_MONTHLY_CREDITS = 250;

        // 判定用户套餐类型
        if (plan.name !== "Lifetime Deal") {
          user.planType = "stripe_monthly";
        } else {
          user.planType = "lifetime";
        }

        // 核心修复：无论是月付还是买断，基础额度都设为 250，且享受每 30 天重置的待遇
        // 买断用户的“无限额度”由 API Key 逻辑控制，此处提供保底的 250 次/月
        user.credits = STRIPE_MONTHLY_CREDITS;
        user.monthlyCreditLimit = STRIPE_MONTHLY_CREDITS;
        user.creditsResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        // ========================================================

        await user.save();

        // Extra: send email with user link, product page, etc...
        break;
      }

      case "checkout.session.expired": {
        break;
      }

      case "customer.subscription.updated": {
        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;

        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );
        const user = await UserModel.findOne({ customerId: subscription.customer });

        if (user) {
          // ================= [ 新增：取消订阅降级逻辑 ] =================
          // 只有订阅用户才降级，买断用户不受影响
          if (user.planType !== "lifetime") {
            user.hasAccess = false;
            user.planType = "free";
            user.credits = 3;
            user.monthlyCreditLimit = 3;
            user.creditsResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await user.save();
          }
          // =========================================================
        }
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product

        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;

        const priceId = stripeObject.lines.data[0].price.id;
        const customerId = stripeObject.customer as string;

        const user = await UserModel.findOne({ customerId });

        if (user) {
          // Make sure the invoice is for the same plan (priceId) the user subscribed to
          if (user.priceId !== priceId) break;

          // ================= [ 新增：每月按期续费充值逻辑 ] =================
          // 只有非买断用户才执行重置逻辑（买断用户没有后续的 invoice.paid 事件）
          if (user.planType !== "lifetime") {
            user.hasAccess = true;
            const STRIPE_MONTHLY_CREDITS = 250;
            user.planType = "stripe_monthly";
            user.credits = STRIPE_MONTHLY_CREDITS;
            user.monthlyCreditLimit = STRIPE_MONTHLY_CREDITS;
            user.creditsResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await user.save();
          }
          // ============================================================
        }
        break;
      }

      case "invoice.payment_failed":
        break;

      default:
      // Unhandled event type
    }
  } catch (e: any) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}