import React from 'react'
import { createRoot } from 'react-dom/client'
import { ApplePayButton, abortApplePaySession } from '@tap-payments/apple-pay-button'

const ApplePaymentReact = () => {
	return (
		<ApplePayButton
			debug={false}
			scope='TapToken'
			publicKey='pk_test_FcYVGop4TyCRLb0qBhIHJzmn'
			environment='development'
			merchant={{
				domain: window.location.hostname,//'thankful-stone-03a740310-preview.centralus.1.azurestaticapps.net',
				id: '67979587'
			}}
			acceptance={{
				supportedBrands: ['mada', 'masterCard', 'visa']
			}}
			features={{
				supportsCouponCode: false
			}}
			transaction={{
				currency: 'SAR',
				amount: '20'
                  }}
		 	customer={{
				name: [
					{
						locale: 'en',
						first: 'test',
						last: 'tester',
						middle: 'test'
					}
				],
				contact: {
					email: 'test@gmail.com',
					phone: {
						number: '1000000000',
						countryCode: '+20'
					}
				}
			}}
			interface={{
				locale: 'en',
				theme: 'dark',
				type: 'buy',
				edges: 'curved'
			}}
			onCancel={() => {
				// it's called when the user cancels the payment
				console.log('onCancel')
			}}
			onError={(error) => {
				// it's called when there is an error with the payment
				console.log('onError', error)
			}}
			onReady={() => {
				// it's called when the apple pay button is ready to click
				console.log('onReady')
			}}
			onSuccess={async (data, event) => {
				// it's called when the payment is successful
				console.log('onSuccess', data)
				// event is the same as the event in the onpaymentauthorized event https://developer.apple.com/documentation/apple_pay_on_the_web/applepaypaymentauthorizedevent
				console.log(event);
			}}
		/>
	)
}

export default ApplePaymentReact;