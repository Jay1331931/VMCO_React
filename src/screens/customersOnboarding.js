import React, { useState, useEffect } from 'react';
import '../styles/components.css';
import '../i18n';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLanguage, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { useParams } from 'react-router-dom';

function CustomersOnboarding() {
    const { id } = useParams();
    // console.log(id)
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [formData, setFormData] = useState({
        leadName: '',
        companyEmail: '',
        companyPhone: '',
        companyName: '',
        region: '',
        password: '',
        confirmpassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);

    const toggleLanguage = () => {
        const newLang = isRTL ? 'en' : 'ar';
        i18n.changeLanguage(newLang);
        document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    };

    const fields = [
        { type: 'text', name: 'leadName', label: t('Customer Name'), placeholder: t('Customer Name'), required: true },
        { type: 'empty' },
        { type: 'text', name: 'companyEmail', label: t('Email (Username)'), placeholder: t('Email (Username)'), required: true },
        { type: 'text', name: 'companyPhone', label: t('Phone Number'), placeholder: t('Phone Number'), required: true },
        { type: 'text', name: 'companyName', label: t('Company Name'), placeholder: t('Company Name'), required: true },
        { type: 'text', name: 'region', label: t('Region'), placeholder: t('Region'), required: true },
        { type: 'password', name: 'password', label: t('Password'), placeholder: t('Password'), required: true },
        { type: 'password', name: 'confirmpassword', label: t('Confirm Password'), placeholder: t('Confirm Password'), required: true }
    ];

    useEffect(() => {
        if (id) {
            const fetchInvitationData = async () => {
                try {
                    // const response = await axios.get(`/customer-registration-staging/onboarding/${id}`);
                    // const res = await fetch('https://vmcoservertest-cyf3gyg4hpb9h7ek.southindia-01.azurewebsites.net/api/user/email-password', {
                    const response = await fetch(`http://localhost:3000/auth/registration/getById/${id}`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });
                    const result = await response.json();
                    console.log(response)
                    console.log(result)
                    if (result.status === "Ok") {
                        // setFormData(prev => ({
                        //     ...prev,
                        //     ...result.data
                        // }));
                        setFormData({
                            leadName: result.data.leadName,
                            companyEmail: result.data.companyEmail,
                            companyPhone: result.data.companyPhone,
                            companyName: result.data.companyName,
                            region: result.data.region,
                            companyName: result.data.companyName,
                        });

                        if (result.data.registered) {
                            setIsRegistered(true);
                        }

                        // setInvitationValid(true);
                    }
                    console.log(formData)
                } catch (error) {
                    console.error('Error fetching invitation data:', error);
                    // setInvitationValid(false);
                } finally {
                    // setIsLoading(false);
                }
            };

            fetchInvitationData();
        }
    }, [id]);


    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{10,15}$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Check all required fields are filled
        fields.forEach(field => {
            if (field.required && !formData[field.name]?.trim()) {
                newErrors[field.name] = t('This field is required');
            }
        });

        // Only proceed with additional validation if fields are filled
        if (!newErrors.email && formData.email && !emailRegex.test(formData.email)) {
            newErrors.email = t('Please enter a valid email address');
        }

        if (!newErrors.phoneNumber && formData.phoneNumber && !phoneRegex.test(formData.phoneNumber)) {
            newErrors.phoneNumber = t('Please enter a valid phone number');
        }

        if (!newErrors.password && formData.password) {
            if (formData.password.length < 8) {
                newErrors.password = t('Password must be at least 8 characters');
            } else if (!passwordRegex.test(formData.password)) {
                newErrors.password = t('Password must contain at least one uppercase, one lowercase, one number and one special character');
            }
        }

        if (!newErrors.confirmpassword && formData.confirmpassword && formData.password !== formData.confirmpassword) {
            newErrors.confirmpassword = t('Passwords do not match');
        }

        setErrors(newErrors);
        let validForm = Object.keys(newErrors).length === 0;
        console.log(validForm)
        return validForm;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form only on submit
        let isValid = validateForm();
        if (isValid) {
            try {
                const response = await fetch('http://localhost:3000/api/auth/registration/user', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.companyEmail,
                        password: formData.password,
                        userType: 'customer',
                    }),
                    credentials: 'include',
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    console.log('Error during registration:', errorData);
                    console.error('Error during registration:', errorData);
                    setErrors({ companyEmail: errorData.details });
                    isValid = false;
                    setIsSubmitting(false);
                }
                const result = await response.json();
                console.log(result);
            }
            catch (error) {
                console.error('Error during registration:', error);
            }
        }

        if (isValid) {
            setIsSubmitting(true);
            if (!isRegistered) {
                const { password, confirmpassword, ...stagingData } = formData;
                // add the fields to customer table also
                // router.post("/auth/registration/customer", customerController.createCustomer);
                try {
                    const response = await fetch('http://localhost:3000/api/auth/registration/customer', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            companyNameEn: formData.companyName,
                            region: formData.region,
                            customerStatus: 'new'
                        }),
                        credentials: 'include',
                    });
                    const result = await response.json();

                    console.log(result);
                    const contactTypesPrimary = ['primary']
                    const contactTypes = ['finance', 'business', 'purchasing'];
                    
                    contactTypesPrimary.forEach(async (type) => {
                         const res = await fetch('http://localhost:3000/api/customer-contacts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                customerId: result.data.id,
                                contactType: type,
                                email: formData.companyEmail,
                                name: formData.leadName,
                                mobile: formData.companyPhone
                            }),
                            credentials: 'include',
                        });
                    });

                    contactTypes.forEach(async (type) => {
                        
                        const res = await fetch('http://localhost:3000/api/customer-contacts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                customerId: result.data.id,
                                contactType: type,
                            }),
                            credentials: 'include',
                        });
                    });

                    const res = await fetch('http://localhost:3000/api/payment-method', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            customerId: result.data.id,
                            methodDetails: {prePayment:{isAllowed:true}, advancePayment:{isAllowed:false, balance: "2000"}, COD:{isAllowed:false, limit: "5000"}, credit:{isAllowed:false, limit: "0", period: "0", balance: "0"}, partialPayment:{isAllowed:false}},
                        }),
                        credentials: 'include',
                    });
                } catch (error) {
                    console.error('Error during registration:', error);
                }
                if (id) {
                    try {
                        const response = await fetch(`http://localhost:3000/api/auth/registration/staging/id/${id}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...stagingData,
                                registered: true
                            }),
                            credentials: 'include',
                        });
                        const result = await response.json();
                        console.log(result);
                        if (result.status === "Ok") {
                            setIsRegistered(true);
                        }
                    } catch (error) {
                        console.error('Error during registration:', error);
                    }
                } else {
                    try {
                        const response = await fetch('http://localhost:3000/api/auth/registration/staging', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                ...stagingData,
                                registered: true
                            }),
                            credentials: 'include',
                        });
                        const result = await response.json();
                        console.log(result);
                    } catch (error) {
                        console.error('Error during registration:', error);
                    }
                }

            }
        }
        if (isSubmitting) {
            try {
                console.log('Form submitted:', formData);
                // Reset form after successful submission
                setFormData({
                    leadName: '',
                    companyEmail: '',
                    companyPhone: '',
                    companyName: '',
                    region: '',
                    password: '',
                    confirmpassword: ''
                });
                setErrors({});
                setIsSubmitting(false);
            } catch (error) {
                console.error('Submission error:', error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div>
            <div className={`app ${isRTL ? 'rtl' : ''}`}>
                <header className='header'>
                    <div className="sidebar-header">
                        <FontAwesomeIcon icon={faLocationDot} size="xl" />
                        <h1>{t('Talab Point')}</h1>
                    </div>
                    <button className="lang-switch-btn" onClick={toggleLanguage}>
                        <FontAwesomeIcon icon={faLanguage} />
                        <span>{isRTL ? 'EN' : 'عربى'}</span>
                    </button>
                </header>
            </div>
            <div className='onboarding-screen'>
                <div className='onboarding-component'>
                    {isRegistered && (
                        <div className="registration-status-message">
                            {t('This customer has already been registered.')}
                        </div>
                    )}
                    <div className="onboarding-header">{t('Customer Onboarding')}</div>

                    <form onSubmit={handleSubmit} className="onboarding-container" noValidate>
                        {fields.map((field, index) => (
                            <div key={index} className="form-group">
                                <label htmlFor={field.name}>
                                    {field.label}
                                    {field.required && <span className="required-field">*</span>}
                                </label>
                                {field.type === 'text' && (
                                    <>
                                        <input
                                            type="text"
                                            id={field.name}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            className={errors[field.name] ? 'error' : ''}
                                            disabled={isRegistered}
                                        />
                                        {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
                                    </>
                                )}
                                {field.type === 'password' && (
                                    <>
                                        <input
                                            type="password"
                                            id={field.name}
                                            name={field.name}
                                            placeholder={field.placeholder}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            className={errors[field.name] ? 'error' : ''}
                                            disabled={isRegistered}
                                        />
                                        {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
                                    </>
                                )}
                                {field.type === 'empty' && <></>}
                            </div>
                        ))}


                    </form>
                    <div className='onboarding-footer'>
                        <button
                            type="submit"
                            className="login-button"
                            disabled={isSubmitting}
                            onClick={handleSubmit}
                        >
                            {t('Submit')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CustomersOnboarding;