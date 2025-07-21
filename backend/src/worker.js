/**
 * BigDayTimer Cloudflare Workers Backend
 * Handles premium user management and Paddle integration
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const router = new Router();
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders
      });
    }
    
    try {
      // Route handlers
      router.get('/health', () => handleHealth());
      router.get('/premium-status/:userId', (request) => handleGetPremiumStatus(request, env));
      router.post('/create-checkout', (request) => handleCreateCheckout(request, env));
      router.post('/paddle-webhook', (request) => handlePaddleWebhook(request, env));
      router.get('/payment-status/:userId', (request) => handlePaymentStatus(request, env));
      
      const response = await router.handle(request);
      
      // Add CORS headers to all responses
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
      
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  }
};

class Router {
  constructor() {
    this.routes = [];
  }
  
  register(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  
  get(path, handler) {
    this.register('GET', path, handler);
  }
  
  post(path, handler) {
    this.register('POST', path, handler);
  }
  
  put(path, handler) {
    this.register('PUT', path, handler);
  }
  
  delete(path, handler) {
    this.register('DELETE', path, handler);
  }
  
  async handle(request) {
    const url = new URL(request.url);
    const method = request.method;
    
    for (const route of this.routes) {
      const match = this.matchRoute(route.path, url.pathname);
      
      if (match && route.method === method) {
        // Add params to request object
        request.params = match.params;
        return await route.handler(request);
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
  
  matchRoute(routePath, pathname) {
    const routeSegments = routePath.split('/').filter(s => s);
    const pathSegments = pathname.split('/').filter(s => s);
    
    if (routeSegments.length !== pathSegments.length) {
      return null;
    }
    
    const params = {};
    
    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const pathSegment = pathSegments[i];
      
      if (routeSegment.startsWith(':')) {
        const paramName = routeSegment.slice(1);
        params[paramName] = pathSegment;
      } else if (routeSegment !== pathSegment) {
        return null;
      }
    }
    
    return { params };
  }
}

// Route handlers
async function handleHealth() {
  return new Response(JSON.stringify({
    status: 'healthy',
    service: 'BigDayTimer Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetPremiumStatus(request, env) {
  const userId = request.params.userId;
  
  if (!userId) {
    return new Response(JSON.stringify({
      error: 'Missing userId parameter'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Check KV store for premium status
    const userRecord = await env.PREMIUM_USERS.get(userId, 'json');
    
    const isPremium = userRecord ? userRecord.isPremium === true : false;
    
    return new Response(JSON.stringify({
      userId,
      isPremium,
      lastChecked: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error checking premium status:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to check premium status',
      userId,
      isPremium: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateCheckout(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await request.json();
    const { userId, plan = 'premium', returnUrl } = body;
    
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Missing userId'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For development, return a mock checkout URL
    if (env.ENVIRONMENT === 'development') {
      const mockCheckoutUrl = `https://checkout.paddle.com/checkout?vendor=${env.PADDLE_VENDOR_ID || '12345'}&product=${plan === 'premium' ? '67890' : '11111'}&passthrough=${encodeURIComponent(JSON.stringify({ userId }))}`;
      
      return new Response(JSON.stringify({
        checkoutUrl: mockCheckoutUrl,
        userId,
        plan
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Production Paddle integration
    const paddleCheckoutData = {
      vendor_id: env.PADDLE_VENDOR_ID,
      product_id: plan === 'premium' ? env.PADDLE_PREMIUM_PRODUCT_ID : env.PADDLE_BASIC_PRODUCT_ID,
      customer_email: '', // Optional
      passthrough: JSON.stringify({ userId, plan }),
      return_url: returnUrl || 'https://your-extension-url.com/success',
      prices: ['USD:4.99'] // One-time payment
    };
    
    const paddleResponse = await fetch('https://vendors.paddle.com/api/2.0/product/generate_pay_link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(paddleCheckoutData)
    });
    
    const paddleResult = await paddleResponse.json();
    
    if (paddleResult.success) {
      return new Response(JSON.stringify({
        checkoutUrl: paddleResult.response.url,
        userId,
        plan
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      throw new Error('Paddle checkout creation failed');
    }
    
  } catch (error) {
    console.error('Error creating checkout:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to create checkout session',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handlePaddleWebhook(request, env) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    // Verify webhook signature (important for security)
    const signature = request.headers.get('X-Paddle-Signature') || params.get('p_signature');
    
    if (!verifyPaddleSignature(body, signature, env.PADDLE_WEBHOOK_SECRET)) {
      return new Response('Invalid signature', { status: 403 });
    }
    
    const alertName = params.get('alert_name');
    
    if (alertName === 'payment_succeeded') {
      await handleSuccessfulPayment(params, env);
    } else if (alertName === 'payment_refunded') {
      await handleRefund(params, env);
    }
    
    return new Response('OK', { status: 200 });
    
  } catch (error) {
    console.error('Error handling webhook:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

async function handleSuccessfulPayment(params, env) {
  try {
    const passthrough = params.get('passthrough');
    
    if (!passthrough) {
      console.error('No passthrough data in webhook');
      return;
    }
    
    const passthroughData = JSON.parse(passthrough);
    const userId = passthroughData.userId;
    
    if (!userId) {
      console.error('No userId in passthrough data');
      return;
    }
    
    // Store premium status in KV
    const userRecord = {
      userId,
      isPremium: true,
      purchaseDate: new Date().toISOString(),
      orderId: params.get('order_id'),
      email: params.get('email'),
      amount: params.get('sale_gross')
    };
    
    await env.PREMIUM_USERS.put(userId, JSON.stringify(userRecord));
    
    console.log(`User ${userId} upgraded to premium`);
    
  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

async function handleRefund(params, env) {
  try {
    const passthrough = params.get('passthrough');
    
    if (!passthrough) {
      console.error('No passthrough data in refund webhook');
      return;
    }
    
    const passthroughData = JSON.parse(passthrough);
    const userId = passthroughData.userId;
    
    if (!userId) {
      console.error('No userId in passthrough data');
      return;
    }
    
    // Remove premium status
    const existingRecord = await env.PREMIUM_USERS.get(userId, 'json');
    
    if (existingRecord) {
      const updatedRecord = {
        ...existingRecord,
        isPremium: false,
        refundDate: new Date().toISOString(),
        refundOrderId: params.get('order_id')
      };
      
      await env.PREMIUM_USERS.put(userId, JSON.stringify(updatedRecord));
    }
    
    console.log(`User ${userId} premium status revoked due to refund`);
    
  } catch (error) {
    console.error('Error processing refund:', error);
  }
}

async function handlePaymentStatus(request, env) {
  const userId = request.params.userId;
  
  if (!userId) {
    return new Response(JSON.stringify({
      error: 'Missing userId parameter'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // This is the same as handleGetPremiumStatus but with additional payment info
  try {
    const userRecord = await env.PREMIUM_USERS.get(userId, 'json');
    
    if (userRecord) {
      return new Response(JSON.stringify({
        userId,
        isPremium: userRecord.isPremium,
        purchaseDate: userRecord.purchaseDate,
        orderId: userRecord.orderId,
        lastChecked: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        userId,
        isPremium: false,
        lastChecked: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    console.error('Error checking payment status:', error);
    
    return new Response(JSON.stringify({
      error: 'Failed to check payment status',
      userId,
      isPremium: false
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function verifyPaddleSignature(body, signature, secret) {
  if (!signature || !secret) {
    return false;
  }
  
  // Paddle signature verification logic
  // This is a simplified version - implement full verification in production
  try {
    const crypto = require('crypto');
    const calculated = crypto
      .createHmac('sha1', secret)
      .update(body)
      .digest('hex');
    
    return calculated === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}