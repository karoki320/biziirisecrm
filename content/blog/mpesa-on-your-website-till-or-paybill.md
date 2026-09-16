---
title: "M-Pesa on your website: Till or Paybill, and how long Daraja really takes"
description: "Nobody publishes the timelines. Here is what you actually need to accept M-Pesa on a website in Kenya, which shortcode to apply for, and where the delays really come from."
date: "2026-09-16"
keyword: "M-Pesa integration website Kenya"
keywords:
  - "M-Pesa integration website Kenya"
  - "Daraja API go live"
  - "M-Pesa Till vs Paybill"
  - "STK push Kenya"
  - "accept M-Pesa payments online"
service: "ecommerce"
faqs:
  - q: "What is the difference between an M-Pesa Till and a Paybill?"
    a: "A Till (Buy Goods) is for paying for goods or services at a point of sale and settles into your account without a reference number. A Paybill takes an account number with each payment, which is what you want when you need to match a payment to a specific order or invoice. For an online shop that must reconcile orders automatically, Paybill is usually the right choice."
  - q: "How long does M-Pesa Daraja go-live approval take?"
    a: "The sandbox is instant — you can build and test the same day. The wait is on the business side: a Till application typically takes a few business days once your documents are in order, a Paybill usually longer because Safaricom asks for more. Budget two to four weeks end to end and start the application before you start building."
  - q: "What documents do I need for an M-Pesa shortcode?"
    a: "For a Till: your KRA PIN, business registration certificate and national ID. For a Paybill, Safaricom typically asks for more, including bank details and an indication of expected transaction volumes. Requirements change, so confirm the current list with Safaricom before you gather documents."
  - q: "Can I take M-Pesa payments without a Paybill or Till?"
    a: "Only by sending customers to your personal number, which means no automatic reconciliation, no receipts and a bookkeeping problem that grows with your sales. It works for the first ten orders and becomes unworkable by the hundredth."
  - q: "What is STK push?"
    a: "STK push is the prompt that appears on the customer's handset asking them to enter their M-Pesa PIN. They never leave your site and never have to copy a number. It is the flow you want, and it requires Daraja API access plus a live shortcode."
---

Every guide to M-Pesa integration in Kenya explains STK push. Almost none of them tell you the one thing you actually need to plan around: **how long the paperwork takes.** That gap has cost more launch dates than any technical problem we have seen.

So, timelines first.

## The part that takes time is not the code

There are two separate tracks, and only one of them is fast.

**The developer track is same-day.** You register on the Safaricom Daraja portal, get sandbox credentials, and you can have STK push working against test numbers within an afternoon. Nothing is gated. Nothing is approved.

**The business track is where the weeks go.** Before you can take a single real shilling you need a live shortcode — a Till or a Paybill — in your business's name, and then you need that shortcode linked to your Daraja app for production. That involves Safaricom, documents, and a queue.

In practice, from a standing start: **budget two to four weeks.** A Till application typically clears in a few business days once your paperwork is right. A Paybill usually takes longer, because Safaricom asks for more and checks more.

The practical advice is simple and almost nobody follows it: **start the shortcode application on day one, before anybody writes code.** The build will be finished long before the approval is.

## Till or Paybill?

This is the decision that is hardest to reverse, so get it right first time.

| | Till (Buy Goods) | Paybill |
|---|---|---|
| Customer enters | Just the till number | Business number **and** an account number |
| Reference per payment | None | Yes — the account number |
| Natural fit | Shop counter, restaurant, salon | Invoices, orders, subscriptions, rent |
| Reconciling automatically | Hard | Straightforward |
| Application | Lighter paperwork | Heavier paperwork |

The short version: **if a payment needs to be matched to a specific thing, you want a Paybill.** The account number is the thing that makes the match possible. An order number goes in that field and your system knows instantly which order was paid.

A Till is fine when the transaction is complete at the moment of payment and nothing needs looking up afterwards. A physical shop, a restaurant, a barber. Online, that is rarely true.

The mistake we see: a business gets a Till because it was faster to obtain, then discovers six months in that nobody can tell which of yesterday's forty payments belongs to which order. They are then reconciling by amount and timestamp, by hand, at night.

## What you need before you apply

For a **Till**, Safaricom typically asks for your KRA PIN, your business registration certificate and your national ID.

For a **Paybill**, expect the above plus more — bank details and some indication of the transaction volumes you expect.

Requirements do change, so confirm the current list with Safaricom rather than trusting any blog post, including this one. What does not change is that everything must be **in the business's name and consistent across documents.** The single most common rejection we see is a mismatch: the name on the KRA PIN not quite matching the name on the registration certificate.

## What "integrated" should actually mean

Plenty of businesses tell us they have M-Pesa on their site and what they mean is a paybill number typed on the checkout page. That is not integration, that is instructions.

A proper integration does four things:

1. **STK push.** The prompt appears on the customer's phone. They never leave your site, never copy a number, never mistype an amount.
2. **A callback handler.** Safaricom calls your server back with the result. Your system records it — success, failure, cancellation — against the right order.
3. **Reconciliation.** The order is marked paid automatically. Nobody checks an SMS inbox.
4. **A receipt.** The customer gets a confirmation carrying the M-Pesa reference, so a dispute two months later takes thirty seconds instead of an evening.

Anything less and you have a payment method, not a payment system. The difference shows up at volume: the first is fine at five orders a day and collapses at fifty.

## The bits that bite

A few things that are obvious in hindsight:

**Your callback URL must be publicly reachable over HTTPS.** Safaricom's servers have to reach it. Localhost will not do, and a self-signed certificate will not do.

**Timeouts are not failures.** A customer who does not enter their PIN within the window produces a timeout, not a payment failure. Handle it separately or you will be telling people their payment failed when they simply put the phone down.

**Sandbox behaviour is not production behaviour.** Test numbers behave more politely than real ones. Budget a day of real transactions at small amounts before you go live properly.

**Keep the raw callback.** Store the entire payload Safaricom sends, not just the fields you need today. The first time you have a dispute, the field you did not save is the one you need.

## If you are starting today

The order that saves the most time:

1. **Apply for the shortcode.** Today. Before anything else.
2. **Build against sandbox** while the application sits in the queue.
3. **Go live and test small** — a handful of real transactions at small amounts.
4. **Then announce it.**

Doing it in that order turns a four-week wait into a four-week build. Doing it in the other order turns a one-week build into a five-week wait.
