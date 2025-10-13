document.addEventListener('DOMContentLoaded', async () => {

  const STRIPE_PUBLISHABLE_KEY = 'pk_test_51JwPICLkgFoZ4U2TxlBryIKQlk5HdDkE1rlLiiuF3pd7ct9uvo2u4g2t6CucuZRYBVYUDOHUJs7RJKdAQ6pCufS400XqmGArY7'
  const stripe = Stripe(STRIPE_PUBLISHABLE_KEY, {
    apiVersion: '2020-08-27',
  });

  const elements = stripe.elements();
  const card = elements.create('card');
  card.mount('#card-element');

  // When the form is submitted...
  const form = document.getElementById('payment-form');
  let submitted = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable double submission of the form
    if(submitted) { return; }
    submitted = true;
    form.querySelector('button').disabled = true;

    // Make a call to the server to create a new
    // payment intent and store its client_secret.
    const {error: backendError, data} = await fetch(
      '/public/stripe/dev/payment-intend/create/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: 'usd',
          paymentMethodType: 'card',
        }),
      }
    ).then((r) => r.json());

    if (backendError) {
      addMessage(backendError.message);

      // reenable the form.
      submitted = false;
      form.querySelector('button').disabled = false;
      return;
    }

    console.table(data);
    const { client_secret, customer, payment_method } = data;

    addMessage(`Client secret returned.`);

    const nameInput = document.querySelector('#name');

    // Confirm the card payment given the clientSecret
    // from the payment intent that was just created on
    // the server.
    const {error: stripeError, paymentIntent} = await stripe.confirmCardPayment(
      client_secret,
      // {
      //   payment_method: payment_method,
      // }
      // {
      //   payment_method: {
      //     card: card,
      //     billing_details: {
      //       name: nameInput.value,
      //     },
      //   },
      // }
    );

    if (stripeError) {
      addMessage(stripeError.message);

      // reenable the form.
      submitted = false;
      form.querySelector('button').disabled = false;
      return;
    }

    addMessage(`Payment ${paymentIntent.status}: ${paymentIntent.id}`);
  });
});
