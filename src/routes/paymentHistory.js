// src/routes/paymentHistory.js - Backend API routes for payment history and subscription management

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const stripe = require('../config/stripe');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/payment-history - Get company's payment history
router.get('/', async (req, res) => {
  try {
    const { companyId } = req.user;

    console.log('companyId::::::::::' , companyId) 

    // Get company with current subscription details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        currentPlan: true,
        subscriptionStatus: true,
        nextBillingDate: true,
        totalSpent: true,
        stripeCustomerId: true,
        subscriptionId: true,
        createdAt: true
      }
    });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Get payment history from database
    const payments = await prisma.paymentHistory.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        transactionId: true,
        stripePaymentId: true,
        date: true,
        plan: true,
        amount: true,
        paymentMethod: true,
        status: true,
        billingPeriod: true
      }
    });

    console.log(company)

    // Get current subscription details from Stripe if subscription exists
    let subscriptionDetails = null;
    if (company.subscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(company.subscriptionId);
        console.log('subscription:::::::' , subscription)
        subscriptionDetails = {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
        };
      } catch (stripeError) {
        console.error('Error fetching subscription from Stripe:', stripeError);
      }
    }

    // Calculate summary statistics
    const stats = {
      currentPlan: company.currentPlan,
      subscriptionStatus: company.subscriptionStatus,
      nextBillingDate: company.nextBillingDate,
      totalSpent: company.totalSpent,
      totalTransactions: payments.length,
      memberSince: company.createdAt
    };

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name
        },
        stats,
        payments,
        subscription: subscriptionDetails
      }
    });

  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch payment history'
    });
  }
});

// POST /api/payment-history/cancel-subscription - Cancel subscription at period end
router.post('/cancel-subscription', async (req, res) => {
  try {
    const { companyId } = req.user;

    // Get company subscription details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionId: true,
        name: true,
        email: true
      }
    });

    if (!company || !company.subscriptionId) {
      return res.status(404).json({ 
        error: 'No active subscription found' 
      });
    }

    // Cancel subscription at period end in Stripe
    const subscription = await stripe.subscriptions.update(company.subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        cancellation_reason: 'User requested cancellation',
        cancelled_by: req.user.email,
        cancelled_at: new Date().toISOString()
      }
    });

    // Update company status in database
    await prisma.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: 'ACTIVE' // Still active until period ends
      }
    });

    console.log(`✅ Subscription cancelled at period end for company: ${company.name}`);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      data: {
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

  } catch (error) {
    console.error('Subscription cancellation error:', error);
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        error: 'Invalid subscription',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to cancel subscription'
    });
  }
});

// POST /api/payment-history/reactivate-subscription - Reactivate cancelled subscription
router.post('/reactivate-subscription', async (req, res) => {
  try {
    const { companyId } = req.user;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        subscriptionId: true,
        name: true
      }
    });

    if (!company || !company.subscriptionId) {
      return res.status(404).json({ 
        error: 'No subscription found' 
      });
    }

    // Reactivate subscription in Stripe
    const subscription = await stripe.subscriptions.update(company.subscriptionId, {
      cancel_at_period_end: false,
      metadata: {
        reactivated_by: req.user.email,
        reactivated_at: new Date().toISOString()
      }
    });

    console.log(`✅ Subscription reactivated for company: ${company.name}`);

    res.json({
      success: true,
      message: 'Subscription has been reactivated',
      data: {
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });

  } catch (error) {
    console.error('Subscription reactivation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reactivate subscription'
    });
  }
});

// GET /api/payment-history/download-invoice/:paymentId - Download invoice PDF
// routes/paymentHistory.js - Fixed invoice download endpoint

// GET /api/payment-history/download-invoice/:paymentId - Download invoice PDF
// UPDATED: routes/paymentHistory.js - Enhanced invoice download with better ID handling

router.get('/download-invoice/:paymentId', async (req, res) => {
  try {
    const { companyId } = req.user;
    const { paymentId } = req.params;

    console.log(`📄 Invoice download requested for payment: ${paymentId}`);

    // Get payment from database
    const payment = await prisma.paymentHistory.findFirst({
      where: {
        id: paymentId,
        companyId: companyId
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Get company details
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { stripeCustomerId: true, name: true }
    });

    if (!company?.stripeCustomerId) {
      return res.status(400).json({ error: 'No Stripe customer information found' });
    }

    try {
      let invoice = null;

      // Method 1: Try stripeInvoiceId first (new field)
      if (payment.stripeInvoiceId) {
        console.log(`🎯 Using stripeInvoiceId: ${payment.stripeInvoiceId}`);
        try {
          invoice = await stripe.invoices.retrieve(payment.stripeInvoiceId);
        } catch (error) {
          console.log(`❌ Failed to retrieve with stripeInvoiceId: ${error.message}`);
        }
      }

      // Method 2: Try stripePaymentId (could be invoice or payment intent)
      if (!invoice && payment.stripePaymentId) {
        console.log(`🔍 Trying stripePaymentId: ${payment.stripePaymentId}`);
        
        if (payment.stripePaymentId.startsWith('in_')) {
          try {
            invoice = await stripe.invoices.retrieve(payment.stripePaymentId);
          } catch (error) {
            console.log(`❌ Failed to retrieve invoice: ${error.message}`);
          }
        } else if (payment.stripePaymentId.startsWith('pi_')) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(payment.stripePaymentId);
            if (paymentIntent.invoice) {
              invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
            }
          } catch (error) {
            console.log(`❌ Failed to retrieve via payment intent: ${error.message}`);
          }
        }
      }

      // Method 3: Search by customer and amount (fallback)
      if (!invoice) {
        console.log(`🔍 Searching invoices by customer and amount`);
        
        const invoices = await stripe.invoices.list({
          customer: company.stripeCustomerId,
          limit: 50,
          status: 'paid'
        });

        const paymentDate = new Date(payment.date);
        invoice = invoices.data.find(inv => {
          const invoiceDate = new Date(inv.created * 1000);
          const invoiceAmount = inv.amount_paid / 100;
          const dateDiff = Math.abs(invoiceDate - paymentDate);
          const within7Days = dateDiff < 7 * 24 * 60 * 60 * 1000;
          const amountMatch = Math.abs(invoiceAmount - payment.amount) < 0.05;
          
          return amountMatch && within7Days;
        });

        // If found via search, update the payment record for future use
        if (invoice) {
          try {
            await prisma.paymentHistory.update({
              where: { id: paymentId },
              data: { 
                stripeInvoiceId: invoice.id,
                stripePaymentId: invoice.id // Update this too for backward compatibility
              }
            });
            console.log(`✅ Updated payment record with found invoice ID: ${invoice.id}`);
          } catch (updateError) {
            console.log(`⚠️ Failed to update payment record: ${updateError.message}`);
          }
        }
      }

      if (invoice && invoice.invoice_pdf) {
        console.log(`✅ Invoice PDF found: ${invoice.number}`);
        return res.json({
          success: true,
          data: {
            invoiceUrl: invoice.invoice_pdf,
            invoiceNumber: invoice.number,
            amount: invoice.amount_paid / 100,
            date: new Date(invoice.created * 1000),
            description: invoice.description || `Payment for ${payment.plan}`
          }
        });
      }

      // No invoice found
      return res.status(404).json({ 
        error: 'Invoice PDF not available',
        details: {
          paymentId: payment.id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          date: payment.date,
          hasStripePaymentId: !!payment.stripePaymentId,
          hasStripeInvoiceId: !!payment.stripeInvoiceId
        }
      });

    } catch (stripeError) {
      console.error(`❌ Stripe API error:`, stripeError);
      return res.status(500).json({ 
        error: 'Failed to retrieve invoice from Stripe',
        details: stripeError.message
      });
    }

   } catch (error) {
    console.error('❌ Invoice download error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve invoice'
    });
  }
});

router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payment history routes are working!',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;