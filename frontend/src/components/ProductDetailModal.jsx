/**
 * Product Detail Modal for Admin
 * Shows full product details with color variant management
 */
import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import ColorVariantManager from './ColorVariantManager';
import { productsAPI } from '../services/api';
import CONFIG from '../config';


const ProductDetailModal = ({ product, onClose, onUpdate }) => {
    const [productData, setProductData] = useState(product);
    const [loading, setLoading] = useState(false);

    const refreshProduct = async () => {
        setLoading(true);
        try {
            const response = await productsAPI.getById(product.id);
            setProductData(response.data);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to refresh product:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-5xl w-full my-8">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <Package className="text-primary-600" size={24} />
                        <div>
                            <h2 className="text-xl font-bold">{productData.name}</h2>
                            <p className="text-sm text-gray-500">Product ID: #{productData.id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {/* Product Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Category:</span>{' '}
                                    <span className="font-medium">{productData.category?.name || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Price:</span>{' '}
                                    <span className="font-medium">₹{productData.original_price}</span>
                                    {productData.discounted_price && (
                                        <span className="text-green-600 ml-2">
                                            (Sale: ₹{productData.discounted_price})
                                        </span>
                                    )}
                                </div>
                                <div>
                                    <span className="text-gray-600">Base Stock:</span>{' '}
                                    <span className="font-medium">{productData.stock}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Status:</span>{' '}
                                    <span className={`font-medium ${productData.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                        {productData.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {productData.sizes && (
                                    <div>
                                        <span className="text-gray-600">Sizes:</span>{' '}
                                        <span className="font-medium">{productData.sizes}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                            <p className="text-sm text-gray-600">
                                {productData.description || 'No description available'}
                            </p>
                        </div>
                    </div>

                    {/* Base Images */}
                    {productData.images && productData.images.filter(img => !img.color_variant_id).length > 0 && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-700 mb-2">Base Product Images</h3>
                            <div className="flex gap-2 overflow-x-auto">
                                {productData.images
                                    .filter(img => !img.color_variant_id)
                                    .map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={img.image_url.startsWith('http') ? img.image_url : `${CONFIG.IMAGE_BASE_URL}${img.image_url}`}
                                            alt={`Product ${idx + 1}`}
                                            className="w-24 h-24 object-cover rounded border"
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Color Variants Section */}
                    <div className="border-t pt-6">
                        <ColorVariantManager
                            productId={productData.id}
                            variants={productData.color_variants || []}
                            onUpdate={refreshProduct}
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="btn btn-secondary w-full md:w-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailModal;
