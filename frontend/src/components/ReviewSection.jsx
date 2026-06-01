import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { reviewsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import Button from './ui/Button';

const ReviewSection = ({ productId }) => {
    const { user, isAuthenticated } = useAuthStore();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const fetchReviews = async () => {
        try {
            const res = await reviewsAPI.getByProduct(productId);
            setReviews(res.data);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (productId) {
            fetchReviews();
        }
    }, [productId]);

    const onSubmit = async (data) => {
        if (!isAuthenticated) {
            toast.error('Please login to submit a review');
            return;
        }
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            const reviewData = {
                rating,
                comment: data.comment
            };
            const res = await reviewsAPI.create(productId, reviewData);
            setReviews([res.data, ...reviews]);
            toast.success('Review submitted successfully!');
            reset();
            setRating(0);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const hasReviewed = isAuthenticated && reviews.some(r => r.user_id === user?.id);

    // Calculate average rating
    const averageRating = reviews.length > 0 
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
        : 0;

    return (
        <div className="mt-16 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <MessageSquare className="text-primary-600" />
                Customer Reviews
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Col: Review Summary & Form */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Summary */}
                    <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-100">
                        <div className="text-5xl font-black text-gray-900 mb-2">{averageRating}</div>
                        <div className="flex justify-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                    key={star} 
                                    size={20} 
                                    className={`${star <= Math.round(averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                />
                            ))}
                        </div>
                        <p className="text-gray-500 font-medium">Based on {reviews.length} reviews</p>
                    </div>

                    {/* Review Form */}
                    {isAuthenticated ? (
                        hasReviewed ? (
                            <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-center font-medium">
                                You have already reviewed this product. Thank you!
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <h3 className="font-bold text-lg text-gray-900">Write a Review</h3>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="focus:outline-none transition-transform hover:scale-110"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                            >
                                                <Star 
                                                    size={28} 
                                                    className={`${
                                                        star <= (hoverRating || rating) 
                                                            ? 'text-yellow-400 fill-yellow-400' 
                                                            : 'text-gray-300'
                                                    } transition-colors`} 
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Comment (Optional)</label>
                                    <textarea
                                        {...register('comment', {
                                            maxLength: { value: 500, message: "Comment is too long" }
                                        })}
                                        rows="4"
                                        placeholder="What did you like or dislike?"
                                        className="w-full rounded-xl border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-3 bg-gray-50 text-gray-900"
                                    ></textarea>
                                    {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment.message}</p>}
                                </div>

                                <Button 
                                    type="submit" 
                                    variant="primary" 
                                    className="w-full" 
                                    isLoading={submitting}
                                >
                                    Submit Review
                                </Button>
                            </form>
                        )
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
                            <p className="text-gray-600 mb-4">Please login to write a review</p>
                            <Button 
                                variant="outline" 
                                onClick={() => window.location.href = '/login'}
                                className="w-full"
                            >
                                Login to Review
                            </Button>
                        </div>
                    )}
                </div>

                {/* Right Col: Reviews List */}
                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-32 bg-gray-100 rounded-xl"></div>
                            ))}
                        </div>
                    ) : reviews.length > 0 ? (
                        <div className="space-y-6">
                            {reviews.map((review) => (
                                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-gray-900">{review.user_name}</p>
                                            <div className="flex mt-1">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star 
                                                        key={star} 
                                                        size={14} 
                                                        className={`${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-400">
                                            {new Date(review.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    {review.comment && (
                                        <p className="text-gray-600 mt-3 whitespace-pre-wrap leading-relaxed">
                                            {review.comment}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Star size={48} className="text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No reviews yet</h3>
                            <p className="text-gray-500">Be the first to review this product!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReviewSection;
