/**
 * Color Variant Manager Component
 * Allows admins to add, edit, and delete color variants for products
 */
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, CheckCircle2 } from 'lucide-react';
import { productsAPI } from '../services/api';
import toast from 'react-hot-toast';

const ColorVariantManager = ({ productId, variants = [], onUpdate }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [formData, setFormData] = useState({
        color_name: '',
        color_code: '',
        stock: 0,
        is_active: true,
        show_in_carousel: false,
        images: []
    });

    const resetForm = () => {
        setFormData({
            color_name: '',
            color_code: '',
            stock: 0,
            is_active: true,
            show_in_carousel: false,
            images: []
        });
        setEditingVariant(null);
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        toast.loading('Uploading images...');
        try {
            const uploadedUrls = [];
            for (const file of files) {
                const response = await productsAPI.uploadImage(file);
                uploadedUrls.push({
                    image_url: response.data.image_url,
                    is_primary: formData.images.length === 0 && uploadedUrls.length === 0
                });
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...uploadedUrls]
            }));
            toast.dismiss();
            toast.success(`Uploaded ${files.length} images`);
        } catch (error) {
            toast.dismiss();
            toast.error('Failed to upload some images');
        }
    };

    const removeVariantImage = (url) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter(img => img.image_url !== url)
        }));
    };

    const setPrimaryImage = (url) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map(img => ({
                ...img,
                is_primary: img.image_url === url
            }))
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.color_name) {
            toast.error('Color name is required');
            return;
        }

        if (formData.images.length === 0) {
            toast.error('Please upload at least one image');
            return;
        }

        try {
            if (editingVariant) {
                await productsAPI.updateColorVariant(productId, editingVariant.id, formData);
                toast.success('Color variant updated successfully');
            } else {
                await productsAPI.addColorVariant(productId, formData);
                toast.success('Color variant added successfully');
            }
            setShowModal(false);
            resetForm();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Error saving variant:', error);
            toast.error('Failed to save variant');
        }
    };

    const handleDelete = async (variantId) => {
        if (!window.confirm('Are you sure you want to delete this color variant?')) return;

        try {
            await productsAPI.deleteColorVariant(productId, variantId);
            toast.success('Color variant deleted');
            if (onUpdate) onUpdate();
        } catch (error) {
            toast.error('Failed to delete variant');
        }
    };

    const openEditModal = (variant) => {
        setEditingVariant(variant);
        setFormData({
            color_name: variant.color_name,
            color_code: variant.color_code || '',
            stock: variant.stock,
            is_active: variant.is_active,
            show_in_carousel: variant.show_in_carousel || false,
            images: variant.images || []
        });
        setShowModal(true);
    };

    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Color Variants</h3>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="btn btn-sm btn-primary flex items-center gap-2"
                >
                    <Plus size={16} /> Add Color
                </button>
            </div>

            {/* Variants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {variant.color_code && (
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                                        style={{ backgroundColor: variant.color_code }}
                                    />
                                )}
                                <span className="font-medium">{variant.color_name}</span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openEditModal(variant)}
                                    className="text-blue-600 hover:text-blue-800"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(variant.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-2 flex justify-between">
                            <span>Stock: <span className="font-medium">{variant.stock}</span></span>
                            {variant.show_in_carousel && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                    In Carousel
                                </span>
                            )}
                        </div>

                        {variant.images && variant.images.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto">
                                {variant.images.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:8000${img.image_url}`}
                                        alt={`${variant.color_name} ${idx + 1}`}
                                        className="w-16 h-16 object-cover rounded border"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">
                                {editingVariant ? 'Edit Color Variant' : 'Add Color Variant'}
                            </h3>
                            <button onClick={() => { setShowModal(false); resetForm(); }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input w-full"
                                    value={formData.color_name}
                                    onChange={(e) => setFormData({ ...formData, color_name: e.target.value })}
                                    placeholder="e.g., Red, Blue, Black"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color Code (Hex)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        className="w-12 h-10 rounded border"
                                        value={formData.color_code || '#000000'}
                                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="input flex-1"
                                        value={formData.color_code}
                                        onChange={(e) => setFormData({ ...formData, color_code: e.target.value })}
                                        placeholder="#FF0000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock Quantity *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="input w-full"
                                    value={formData.stock}
                                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Images *
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="input w-full"
                                />
                                {formData.images.length > 0 && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={img.image_url.startsWith('http') ? img.image_url : `http://localhost:8000${img.image_url}`}
                                                    alt={`Preview ${idx + 1}`}
                                                    className={`w-20 h-20 object-cover rounded border-2 ${img.is_primary ? 'border-primary-600' : 'border-gray-200'}`}
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPrimaryImage(img.image_url)}
                                                        className="p-1 bg-white rounded text-primary-600 hover:text-primary-700"
                                                        title="Set as primary"
                                                    >
                                                        <CheckCircle2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeVariantImage(img.image_url)}
                                                        className="p-1 bg-white rounded text-red-600 hover:text-red-700"
                                                        title="Remove"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                {img.is_primary && (
                                                    <span className="absolute bottom-0 left-0 right-0 bg-primary-600 text-white text-[10px] text-center">Primary</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-6">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="mr-2"
                                    />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                        Active
                                    </label>
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="show_in_carousel"
                                        checked={formData.show_in_carousel}
                                        onChange={(e) => setFormData({ ...formData, show_in_carousel: e.target.checked })}
                                        className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="show_in_carousel" className="text-sm font-medium text-gray-700">
                                        Show in Product Carousel
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingVariant ? 'Update' : 'Add'} Variant
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorVariantManager;
