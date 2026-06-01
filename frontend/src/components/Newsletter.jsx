import { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { newsletterAPI } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Newsletter = () => {
    const [status, setStatus] = useState('idle'); // idle, loading, success
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setStatus('loading');
        try {
            const res = await newsletterAPI.subscribe(data);
            setStatus('success');
            toast.success(res.data.message);
            reset();
            setTimeout(() => setStatus('idle'), 5000); // Reset to idle after 5 seconds
        } catch (error) {
            setStatus('idle');
            // The API interceptor usually shows toast on error, but we can catch specific ones here
            if (error.response?.status === 400) {
                toast.error(error.response.data.detail || 'Subscription failed');
            }
        }
    };

    return (
        <section className="bg-primary-900 py-16 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary-800 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-800 rounded-full blur-3xl opacity-50 translate-x-1/2 translate-y-1/2" />
            
            <div className="container relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Mail className="mx-auto text-primary-300 mb-6" size={48} />
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
                            Join Our Newsletter
                        </h2>
                        <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
                            Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals delivered straight to your inbox.
                        </p>
                    </motion.div>

                    <AnimatePresence mode="wait">
                        {status === 'success' ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-primary-800/50 backdrop-blur border border-primary-700 p-8 rounded-2xl inline-flex flex-col items-center"
                            >
                                <CheckCircle className="text-green-400 mb-3" size={40} />
                                <h3 className="text-xl font-semibold text-white mb-1">You're on the list!</h3>
                                <p className="text-primary-200">Thanks for subscribing. Keep an eye on your inbox.</p>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                onSubmit={handleSubmit(onSubmit)}
                                className="max-w-md mx-auto relative"
                            >
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="flex-1 relative">
                                        <input
                                            type="email"
                                            placeholder="Enter your email address"
                                            className="w-full bg-white/10 backdrop-blur border-2 border-primary-700/50 text-white placeholder-primary-300 px-5 py-4 rounded-xl focus:outline-none focus:border-white focus:bg-white/20 transition-all"
                                            {...register('email', { 
                                                required: 'Email is required',
                                                pattern: {
                                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                    message: "Invalid email address"
                                                }
                                            })}
                                        />
                                        {errors.email && (
                                            <p className="absolute -bottom-6 left-2 text-sm text-red-300 text-left w-full">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="bg-white text-primary-900 px-8 py-4 rounded-xl font-bold hover:bg-primary-50 transition-colors flex items-center justify-center disabled:opacity-70"
                                    >
                                        {status === 'loading' ? (
                                            <div className="w-5 h-5 border-2 border-primary-900 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Subscribe <Send size={18} className="ml-2" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
};

export default Newsletter;
