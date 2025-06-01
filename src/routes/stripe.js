// // // routes/stripe.js - Updated webhook handlers for better payment tracking

// // const express = require('express');
// // const { PrismaClient } = require('@prisma/client');
// // const stripe = require('../config/stripe');
// // const { sendWelcomeEmail } = require('../services/emailService');
// // const { generateTempPassword, generateTransactionId } = require('../utils/helpers');
// // const authService = require('../services/authService');

// // const router = express.Router();
// // const prisma = new PrismaClient();

// // // Stripe webhook endpoint
// // router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
// //   const sig = req.headers['stripe-signature'];
// //   let event;

// //   try {
// //     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
// //   } catch (err) {
// //     console.error('❌ Webhook signature verification failed:', err.message);
// //     return res.status(400).send(`Webhook Error: ${err.message}`);
// //   }

// //   console.log(`🔔 Received webhook: ${event.type}`);

// //   try {
// //     switch (event.type) {
// //       case 'checkout.session.completed':
// //         await handleSuccessfulPayment(event.data.object);
// //         break;
        
// //       case 'customer.subscription.updated':
// //         await handleSubscriptionUpdate(event.data.object);
// //         break;
        
// //       case 'customer.subscription.deleted':
// //         await handleSubscriptionCancellation(event.data.object);
// //         break;
        
// //       case 'invoice.payment_succeeded':
// //         await handlePaymentSucceeded(event.data.object);
// //         break;
        
// //       case 'invoice.payment_failed':
// //         await handlePaymentFailed(event.data.object);
// //         break;

// //       case 'invoice.created':
// //         await handleInvoiceCreated(event.data.object);
// //         break;
        
// //       default:
// //         console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
// //     }
// //   } catch (error) {
// //     console.error(`❌ Error processing webhook ${event.type}:`, error);
// //     return res.status(500).send('Webhook processing failed');
// //   }

// //   res.json({ received: true });
// // });

// // // Handle successful initial payment (checkout.session.completed)
// // async function handleSuccessfulPayment(session) {
// //   const { customer, subscription, metadata } = session;
  
// //   console.log(`💰 Processing successful payment for company: ${metadata.companyName}`);
// //   try {
// //     // Step 1: Update company status
// //     const company = await prisma.company.update({
// //       where: { id: metadata.companyId },
// //       data: {
// //         stripeCustomerId: customer,
// //         subscriptionId: subscription,
// //         subscriptionStatus: 'ACTIVE',
// //         nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
// //         isActive: true
// //       }
// //     });

// //     // Step 2: Create user with custom auth (no Auth0)
// //     const tempPassword = generateTempPassword();
    
// //     const user = await authService.createUser({
// //       companyId: company.id,
// //       email: company.email,
// //       firstName: metadata.firstName,
// //       lastName: metadata.lastName,
// //       password: tempPassword,
// //       role: 'ADMIN',
// //       status: 'ACTIVE'
// //     });

// //     console.log(`👤 User created: ${user.id}`);

// //     // Step 3: Create initial payment history record
// //     await prisma.paymentHistory.create({
// //       data: {
// //         companyId: company.id,
// //         transactionId: generateTransactionId(),
// //         stripePaymentId: session.payment_intent,
// //         plan: metadata.plan.toUpperCase(),
// //         amount: session.amount_total / 100,
// //         paymentMethod: 'Credit Card',
// //         status: 'COMPLETED',
// //         billingPeriod: 'MONTHLY'
// //       }
// //     });

// //     // Update company total spent
// //     await prisma.company.update({
// //       where: { id: company.id },
// //       data: {
// //         totalSpent: {
// //           increment: session.amount_total / 100
// //         }
// //       }
// //     });

// //     // Step 4: Send welcome email
// //     await sendWelcomeEmail({
// //       email: company.email,
// //       companyName: company.name,
// //       subdomain: company.subdomain,
// //       firstName: metadata.firstName,
// //       tempPassword,
// //       loginUrl: `${process.env.FRONTEND_URL}/login`
// //     });

// //     console.log(`✅ Onboarding completed successfully for ${company.name}`);
// //   } catch (error) {
// //     console.error('❌ Onboarding process failed:', error);
// //   }
// // }

// // // Handle subscription updates (including cancellations)
// // async function handleSubscriptionUpdate(subscription) {
// //   console.log(`🔄 Subscription updated: ${subscription.id}`);
  
// //   try {
// //     const company = await prisma.company.findFirst({
// //       where: { subscriptionId: subscription.id }
// //     });

// //     if (company) {
// //       let subscriptionStatus = subscription.status.toUpperCase();
      
// //       // Handle special cases
// //       if (subscription.cancel_at_period_end && subscription.status === 'active') {
// //         subscriptionStatus = 'ACTIVE'; // Still active until period ends
// //       }

// //       await prisma.company.update({
// //         where: { id: company.id },
// //         data: {
// //           subscriptionStatus,
// //           nextBillingDate: subscription.current_period_end 
// //             ? new Date(subscription.current_period_end * 1000) 
// //             : null,
// //           isActive: subscription.status === 'active'
// //         }
// //       });

// //       console.log(`✅ Company ${company.name} subscription status updated to: ${subscriptionStatus}`);
// //     }
// //   } catch (error) {
// //     console.error('❌ Failed to update subscription:', error);
// //   }
// // }

// // // Handle subscription cancellation
// // async function handleSubscriptionCancellation(subscription) {
// //   console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
// //   try {
// //     const company = await prisma.company.findFirst({
// //       where: { subscriptionId: subscription.id }
// //     });

// //     if (company) {
// //       await prisma.company.update({
// //         where: { id: company.id },
// //         data: {
// //           subscriptionStatus: 'CANCELLED',
// //           isActive: false,
// //           nextBillingDate: null
// //         }
// //       });

// //       console.log(`✅ Company ${company.name} subscription cancelled`);
// //     }
// //   } catch (error) {
// //     console.error('❌ Failed to handle cancellation:', error);
// //   }
// // }

// // // Handle recurring payment success
// // async function handlePaymentSucceeded(invoice) {
// //   if (invoice.subscription) {
// //     console.log(`💳 Payment succeeded for subscription: ${invoice.subscription}`);
    
// //     try {
// //       const company = await prisma.company.findFirst({
// //         where: { subscriptionId: invoice.subscription }
// //       });

// //       if (company) {
// //         // Create payment history record
// //         const paymentRecord = await prisma.paymentHistory.create({
// //           data: {
// //             companyId: company.id,
// //             transactionId: generateTransactionId(),
// //             stripePaymentId: invoice.payment_intent,
// //             plan: company.currentPlan,
// //             amount: invoice.amount_paid / 100,
// //             paymentMethod: 'Credit Card',
// //             status: 'COMPLETED',
// //             billingPeriod: 'MONTHLY'
// //           }
// //         });

// //         // Update company details
// //         await prisma.company.update({
// //           where: { id: company.id },
// //           data: {
// //             nextBillingDate: new Date(invoice.period_end * 1000),
// //             subscriptionStatus: 'ACTIVE',
// //             isActive: true,
// //             totalSpent: {
// //               increment: invoice.amount_paid / 100
// //             }
// //           }
// //         });

// //         console.log(`✅ Payment recorded for ${company.name}: ${paymentRecord.transactionId}`);
// //       }
// //     } catch (error) {
// //       console.error('❌ Failed to record payment:', error);
// //     }
// //   }
// // }

// // // Handle payment failure
// // async function handlePaymentFailed(invoice) {
// //   if (invoice.subscription) {
// //     console.log(`💸 Payment failed for subscription: ${invoice.subscription}`);
    
// //     try {
// //       const company = await prisma.company.findFirst({
// //         where: { subscriptionId: invoice.subscription }
// //       });

// //       if (company) {
// //         // Create failed payment record
// //         await prisma.paymentHistory.create({
// //           data: {
// //             companyId: company.id,
// //             transactionId: generateTransactionId(),
// //             stripePaymentId: invoice.payment_intent,
// //             plan: company.currentPlan,
// //             amount: invoice.amount_due / 100,
// //             paymentMethod: 'Credit Card',
// //             status: 'FAILED',
// //             billingPeriod: 'MONTHLY'
// //           }
// //         });

// //         // Update company status
// //         await prisma.company.update({
// //           where: { id: company.id },
// //           data: {
// //             subscriptionStatus: 'PAST_DUE'
// //           }
// //         });

// //         console.log(`❌ Failed payment recorded for ${company.name}`);
// //         // TODO: Send payment failure notification email
// //       }
// //     } catch (error) {
// //       console.error('❌ Failed to handle payment failure:', error);
// //     }
// //   }
// // }

// // // Handle invoice creation (for better tracking)
// // async function handleInvoiceCreated(invoice) {
// //   if (invoice.subscription) {
// //     console.log(`📄 Invoice created for subscription: ${invoice.subscription}`);
    
// //     try {
// //       const company = await prisma.company.findFirst({
// //         where: { subscriptionId: invoice.subscription }
// //       });

// //       if (company) {
// //         // Create pending payment record
// //         await prisma.paymentHistory.create({
// //           data: {
// //             companyId: company.id,
// //             transactionId: generateTransactionId(),
// //             stripePaymentId: invoice.id, // Use invoice ID for pending payments
// //             plan: company.currentPlan,
// //             amount: invoice.amount_due / 100,
// //             paymentMethod: 'Credit Card',
// //             status: 'PENDING',
// //             billingPeriod: 'MONTHLY'
// //           }
// //         });

// //         console.log(`📋 Pending payment record created for ${company.name}`);
// //       }
// //     } catch (error) {
// //       console.error('❌ Failed to create pending payment record:', error);
// //     }
// //   }
// // }

// // module.exports = router;

// // routes/stripe.js - FIXED webhook handlers for better payment tracking

// const express = require('express');
// const { PrismaClient } = require('@prisma/client');
// const stripe = require('../config/stripe');
// const { sendWelcomeEmail } = require('../services/emailService');
// const { generateTempPassword, generateTransactionId } = require('../utils/helpers');
// const authService = require('../services/authService');

// const router = express.Router();
// const prisma = new PrismaClient();

// // Stripe webhook endpoint
// router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//   } catch (err) {
//     console.error('❌ Webhook signature verification failed:', err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   console.log(`🔔 Received webhook: ${event.type}`);

//   try {
//     switch (event.type) {
//       case 'checkout.session.completed':
//         await handleSuccessfulPayment(event.data.object);
//         break;
        
//       case 'customer.subscription.updated':
//         await handleSubscriptionUpdate(event.data.object);
//         break;
        
//       case 'customer.subscription.deleted':
//         await handleSubscriptionCancellation(event.data.object);
//         break;
        
//       case 'invoice.payment_succeeded':
//         await handlePaymentSucceeded(event.data.object);
//         break;
        
//       case 'invoice.payment_failed':
//         await handlePaymentFailed(event.data.object);
//         break;

//       // REMOVED: invoice.created handler to avoid duplicate records
        
//       default:
//         console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
//     }
//   } catch (error) {
//     console.error(`❌ Error processing webhook ${event.type}:`, error);
//     return res.status(500).send('Webhook processing failed');
//   }

//   res.json({ received: true });
// });

// // FIXED: Handle successful initial payment (checkout.session.completed)
// async function handleSuccessfulPayment(session) {
//   const { customer, subscription, metadata } = session;
  
//   console.log(`💰 Processing successful payment for company: ${metadata.companyName}`);
//   try {
//     // Get the invoice from the session to extract invoice details
//     let invoiceId = null;
//     let paymentIntentId = session.payment_intent;
    
//     if (subscription) {
//       try {
//         // Get the subscription to find the latest invoice
//         const stripeSubscription = await stripe.subscriptions.retrieve(subscription);
//         if (stripeSubscription.latest_invoice) {
//           invoiceId = stripeSubscription.latest_invoice;
//           console.log(`📄 Found invoice ID: ${invoiceId}`);
//         }
//       } catch (error) {
//         console.error('Error retrieving subscription invoice:', error);
//       }
//     }

//     // Step 1: Update company status
//     const company = await prisma.company.update({
//       where: { id: metadata.companyId },
//       data: {
//         stripeCustomerId: customer,
//         subscriptionId: subscription,
//         subscriptionStatus: 'ACTIVE',
//         nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
//         isActive: true
//       }
//     });

//     // Step 2: Create user with custom auth (no Auth0)
//     const tempPassword = generateTempPassword();
    
//     const user = await authService.createUser({
//       companyId: company.id,
//       email: company.email,
//       firstName: metadata.firstName,
//       lastName: metadata.lastName,
//       password: tempPassword,
//       role: 'ADMIN',
//       status: 'ACTIVE'
//     });

//     console.log(`👤 User created: ${user.id}`);

//     // Step 3: Create initial payment history record with BOTH IDs
//     const paymentRecord = await prisma.paymentHistory.create({
//       data: {
//         companyId: company.id,
//         transactionId: generateTransactionId(),
//         stripePaymentId: invoiceId || paymentIntentId, // Prefer invoice ID for PDF access
//         plan: metadata.plan.toUpperCase(),
//         amount: session.amount_total / 100,
//         paymentMethod: 'Credit Card',
//         status: 'COMPLETED',
//         billingPeriod: 'MONTHLY',
//         // Add these new fields if they don't exist in your schema
//         stripeInvoiceId: invoiceId,
//         stripePaymentIntentId: paymentIntentId
//       }
//     });

//     console.log(`💳 Payment record created: ${paymentRecord.transactionId} with invoice ID: ${invoiceId}`);

//     // Update company total spent
//     await prisma.company.update({
//       where: { id: company.id },
//       data: {
//         totalSpent: {
//           increment: session.amount_total / 100
//         }
//       }
//     });

//     // Step 4: Send welcome email
//     await sendWelcomeEmail({
//       email: company.email,
//       companyName: company.name,
//       subdomain: company.subdomain,
//       firstName: metadata.firstName,
//       tempPassword,
//       loginUrl: `${process.env.FRONTEND_URL}/login`
//     });

//     console.log(`✅ Onboarding completed successfully for ${company.name}`);
//   } catch (error) {
//     console.error('❌ Onboarding process failed:', error);
//   }
// }

// // Handle subscription updates (including cancellations)
// async function handleSubscriptionUpdate(subscription) {
//   console.log(`🔄 Subscription updated: ${subscription.id}`);
  
//   try {
//     const company = await prisma.company.findFirst({
//       where: { subscriptionId: subscription.id }
//     });

//     if (company) {
//       let subscriptionStatus = subscription.status.toUpperCase();
      
//       // Handle special cases
//       if (subscription.cancel_at_period_end && subscription.status === 'active') {
//         subscriptionStatus = 'ACTIVE'; // Still active until period ends
//       }

//       await prisma.company.update({
//         where: { id: company.id },
//         data: {
//           subscriptionStatus,
//           nextBillingDate: subscription.current_period_end 
//             ? new Date(subscription.current_period_end * 1000) 
//             : null,
//           isActive: subscription.status === 'active'
//         }
//       });

//       console.log(`✅ Company ${company.name} subscription status updated to: ${subscriptionStatus}`);
//     }
//   } catch (error) {
//     console.error('❌ Failed to update subscription:', error);
//   }
// }

// // Handle subscription cancellation
// async function handleSubscriptionCancellation(subscription) {
//   console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
//   try {
//     const company = await prisma.company.findFirst({
//       where: { subscriptionId: subscription.id }
//     });

//     if (company) {
//       await prisma.company.update({
//         where: { id: company.id },
//         data: {
//           subscriptionStatus: 'CANCELLED',
//           isActive: false,
//           nextBillingDate: null
//         }
//       });

//       console.log(`✅ Company ${company.name} subscription cancelled`);
//     }
//   } catch (error) {
//     console.error('❌ Failed to handle cancellation:', error);
//   }
// }

// // FIXED: Handle recurring payment success - this is the most important fix
// async function handlePaymentSucceeded(invoice) {
//   if (invoice.subscription) {
//     console.log(`💳 Payment succeeded for invoice: ${invoice.id}, subscription: ${invoice.subscription}`);
    
//     try {
//       const company = await prisma.company.findFirst({
//         where: { subscriptionId: invoice.subscription }
//       });

//       if (company) {
//         // Check if payment record already exists for this invoice
//         const existingPayment = await prisma.paymentHistory.findFirst({
//           where: {
//             companyId: company.id,
//             stripePaymentId: invoice.id
//           }
//         });

//         if (existingPayment) {
//           console.log(`✅ Payment record already exists for invoice ${invoice.id}, updating status`);
          
//           // Update existing record
//           await prisma.paymentHistory.update({
//             where: { id: existingPayment.id },
//             data: {
//               status: 'COMPLETED',
//               stripeInvoiceId: invoice.id,
//               stripePaymentIntentId: invoice.payment_intent
//             }
//           });
//         } else {
//           // Create NEW payment history record with the INVOICE ID (key fix!)
//           const paymentRecord = await prisma.paymentHistory.create({
//             data: {
//               companyId: company.id,
//               transactionId: generateTransactionId(),
//               stripePaymentId: invoice.id, // ← CRITICAL: Store invoice ID for PDF access
//               plan: company.currentPlan,
//               amount: invoice.amount_paid / 100,
//               paymentMethod: 'Credit Card',
//               status: 'COMPLETED',
//               billingPeriod: 'MONTHLY',
//               // Add these if your schema supports them
//               stripeInvoiceId: invoice.id,
//               stripePaymentIntentId: invoice.payment_intent
//             }
//           });

//           console.log(`💳 NEW payment record created: ${paymentRecord.transactionId} for invoice: ${invoice.id}`);
//         }

//         // Update company details
//         await prisma.company.update({
//           where: { id: company.id },
//           data: {
//             nextBillingDate: new Date(invoice.period_end * 1000),
//             subscriptionStatus: 'ACTIVE',
//             isActive: true,
//             totalSpent: {
//               increment: invoice.amount_paid / 100
//             }
//           }
//         });

//         console.log(`✅ Payment recorded for ${company.name} - Invoice: ${invoice.id}`);
//       }
//     } catch (error) {
//       console.error('❌ Failed to record payment:', error);
//     }
//   }
// }

// // FIXED: Handle payment failure
// async function handlePaymentFailed(invoice) {
//   if (invoice.subscription) {
//     console.log(`💸 Payment failed for invoice: ${invoice.id}, subscription: ${invoice.subscription}`);
    
//     try {
//       const company = await prisma.company.findFirst({
//         where: { subscriptionId: invoice.subscription }
//       });

//       if (company) {
//         // Create failed payment record with invoice ID
//         await prisma.paymentHistory.create({
//           data: {
//             companyId: company.id,
//             transactionId: generateTransactionId(),
//             stripePaymentId: invoice.id, // Store invoice ID even for failed payments
//             plan: company.currentPlan,
//             amount: invoice.amount_due / 100,
//             paymentMethod: 'Credit Card',
//             status: 'FAILED',
//             billingPeriod: 'MONTHLY',
//             stripeInvoiceId: invoice.id,
//             stripePaymentIntentId: invoice.payment_intent
//           }
//         });

//         // Update company status
//         await prisma.company.update({
//           where: { id: company.id },
//           data: {
//             subscriptionStatus: 'PAST_DUE'
//           }
//         });

//         console.log(`❌ Failed payment recorded for ${company.name} - Invoice: ${invoice.id}`);
//         // TODO: Send payment failure notification email
//       }
//     } catch (error) {
//       console.error('❌ Failed to handle payment failure:', error);
//     }
//   }
// }

// module.exports = router;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const stripe = require('../config/stripe');
const { sendWelcomeEmail } = require('../services/emailService');
const { generateTempPassword, generateTransactionId } = require('../utils/helpers');
const authService = require('../services/authService');
const { initializeCompanyForms } = require('./forms'); // Import the helper function

const router = express.Router();
const prisma = new PrismaClient();

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`🔔 Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleSuccessfulPayment(event.data.object);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`🤷‍♂️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);
    return res.status(500).send('Webhook processing failed');
  }

  res.json({ received: true });
});

// Updated function with form initialization
async function handleSuccessfulPayment(session) {
  const { customer, subscription, metadata } = session;
  
  console.log(`💰 Processing successful payment for company: ${metadata.companyName}`);
  try {
    // Step 1: Update company status
    const company = await prisma.company.update({
      where: { id: metadata.companyId },
      data: {
        stripeCustomerId: customer,
        subscriptionId: subscription,
        subscriptionStatus: 'ACTIVE',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      }
    });

    console.log(`✅ Company activated: ${company.name}`);

    // Step 2: Initialize default forms for the company
    try {
      await initializeCompanyForms(company.id);
      console.log(`✅ Default forms initialized for: ${company.name}`);
    } catch (formError) {
      console.error(`❌ Failed to initialize forms for ${company.name}:`, formError);
      // Don't fail the entire process if form initialization fails
    }

    // Step 3: Create user with custom auth (no Auth0)
    const tempPassword = generateTempPassword();
    
    const user = await authService.createUser({
      companyId: company.id,
      email: company.email,
      firstName: metadata.firstName,
      lastName: metadata.lastName,
      password: tempPassword, // Will be hashed automatically
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    console.log(`👤 User created: ${user.id}`);

    // Step 4: Create payment history
    await prisma.paymentHistory.create({
      data: {
        companyId: company.id,
        transactionId: generateTransactionId(),
        stripePaymentId: session.payment_intent,
        plan: metadata.plan.toUpperCase(),
        amount: session.amount_total / 100,
        paymentMethod: 'Credit Card',
        status: 'COMPLETED',
        billingPeriod: 'MONTHLY'
      }
    });

    // Step 5: Send welcome email with login credentials
    await sendWelcomeEmail({
      email: company.email,
      companyName: company.name,
      subdomain: company.subdomain,
      firstName: metadata.firstName,
      tempPassword, // Send the plain password in email
      loginUrl: `${process.env.FRONTEND_URL}/login`
    });

    console.log(`✅ Onboarding completed successfully for ${company.name}`);
  } catch (error) {
    console.error('❌ Onboarding process failed:', error);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdate(subscription) {
  console.log(`🔄 Subscription updated: ${subscription.id}`);
  
  try {
    const company = await prisma.company.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: subscription.status.toUpperCase(),
          nextBillingDate: new Date(subscription.current_period_end * 1000)
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to update subscription:', error);
  }
}

// Handle subscription cancellation
async function handleSubscriptionCancellation(subscription) {
  console.log(`❌ Subscription cancelled: ${subscription.id}`);
  
  try {
    const company = await prisma.company.findFirst({
      where: { subscriptionId: subscription.id }
    });

    if (company) {
      await prisma.company.update({
        where: { id: company.id },
        data: {
          subscriptionStatus: 'CANCELLED',
          isActive: false
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to handle cancellation:', error);
  }
}

// Handle recurring payment success
async function handlePaymentSucceeded(invoice) {
  if (invoice.subscription) {
    console.log(`💳 Payment succeeded for subscription: ${invoice.subscription}`);
    
    try {
      const company = await prisma.company.findFirst({
        where: { subscriptionId: invoice.subscription }
      });

      if (company) {
        // Record payment
        await prisma.paymentHistory.create({
          data: {
            companyId: company.id,
            transactionId: generateTransactionId(),
            stripePaymentId: invoice.payment_intent,
            plan: company.currentPlan,
            amount: invoice.amount_paid / 100,
            paymentMethod: 'Credit Card',
            status: 'COMPLETED',
            billingPeriod: 'MONTHLY'
          }
        });

        // Update next billing date
        await prisma.company.update({
          where: { id: company.id },
          data: {
            nextBillingDate: new Date(invoice.period_end * 1000),
            totalSpent: {
              increment: invoice.amount_paid / 100
            }
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to record payment:', error);
    }
  }
}

// Handle payment failure
async function handlePaymentFailed(invoice) {
  if (invoice.subscription) {
    console.log(`💸 Payment failed for subscription: ${invoice.subscription}`);
    
    try {
      const company = await prisma.company.findFirst({
        where: { subscriptionId: invoice.subscription }
      });

      if (company) {
        await prisma.company.update({
          where: { id: company.id },
          data: {
            subscriptionStatus: 'PAST_DUE'
          }
        });

        // TODO: Send payment failure notification email
      }
    } catch (error) {
      console.error('❌ Failed to handle payment failure:', error);
    }
  }
}

module.exports = router;