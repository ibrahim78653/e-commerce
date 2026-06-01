import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle, Home, Briefcase } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { addressesAPI } from '../services/api';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AddressBook = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm();

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await addressesAPI.getAll();
            setAddresses(res.data);
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (addr = null) => {
        if (addr) {
            setEditingId(addr.id);
            setValue('label', addr.label);
            setValue('full_name', addr.full_name);
            setValue('phone', addr.phone);
            setValue('address_line1', addr.address_line1);
            setValue('address_line2', addr.address_line2 || '');
            setValue('city', addr.city);
            setValue('state', addr.state);
            setValue('pincode', addr.pincode);
            setValue('is_default', addr.is_default);
        } else {
            setEditingId(null);
            reset({ label: 'Home', is_default: addresses.length === 0 });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data) => {
        setSaving(true);
        try {
            if (editingId) {
                await addressesAPI.update(editingId, data);
                toast.success('Address updated');
            } else {
                await addressesAPI.create(data);
                toast.success('Address added');
            }
            setIsModalOpen(false);
            fetchAddresses();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to save address');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;
        try {
            await addressesAPI.delete(id);
            toast.success('Address deleted');
            fetchAddresses();
        } catch (error) {
            toast.error('Failed to delete address');
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await addressesAPI.setDefault(id);
            toast.success('Default address updated');
            fetchAddresses();
        } catch (error) {
            toast.error('Failed to update default address');
        }
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div></div>;
    }

    return (
        <div className="card mt-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <MapPin className="mr-2" size={24} />
                    Address Book
                </h2>
                <Button variant="outline" size="sm" onClick={() => openModal()} icon={Plus}>
                    Add New
                </Button>
            </div>

            {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <MapPin className="mx-auto mb-2 text-gray-300" size={40} />
                    <p>No addresses saved yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence>
                        {addresses.map(addr => (
                            <motion.div
                                key={addr.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`relative p-4 rounded-xl border-2 transition-colors ${addr.is_default ? 'border-primary-500 bg-primary-50/30' : 'border-gray-200 bg-white'}`}
                            >
                                {addr.is_default && (
                                    <span className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg flex items-center">
                                        <CheckCircle size={12} className="mr-1" /> Default
                                    </span>
                                )}
                                <div className="flex items-center gap-2 mb-2">
                                    {addr.label?.toLowerCase() === 'work' ? <Briefcase size={16} className="text-gray-500" /> : <Home size={16} className="text-gray-500" />}
                                    <span className="font-semibold text-gray-900 uppercase text-xs tracking-wider">{addr.label}</span>
                                </div>
                                
                                <p className="font-medium text-gray-900 mb-1">{addr.full_name}</p>
                                <p className="text-sm text-gray-600 mb-1">{addr.phone}</p>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4 h-10">
                                    {addr.address_line1} {addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                                    {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                                
                                <div className="flex gap-2 pt-3 border-t border-gray-100">
                                    {!addr.is_default && (
                                        <button onClick={() => handleSetDefault(addr.id)} className="text-xs font-medium text-primary-600 hover:text-primary-800 flex-1 text-left">
                                            Set as Default
                                        </button>
                                    )}
                                    <div className={addr.is_default ? "flex-1 flex justify-end gap-3" : "flex gap-3"}>
                                        <button onClick={() => openModal(addr)} className="text-gray-500 hover:text-primary-600" title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(addr.id)} className="text-gray-500 hover:text-red-600" title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Address" : "Add New Address"}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="Home" {...register('label')} className="text-primary-600" defaultChecked />
                            <span className="text-sm font-medium">Home</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="Work" {...register('label')} className="text-primary-600" />
                            <span className="text-sm font-medium">Work</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" value="Other" {...register('label')} className="text-primary-600" />
                            <span className="text-sm font-medium">Other</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <Input label="Full Name" error={errors.full_name?.message} {...register('full_name', { required: 'Required' })} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <Input label="Phone Number" error={errors.phone?.message} {...register('phone', { required: 'Required', pattern: { value: /^[0-9]{10,15}$/, message: 'Invalid phone' } })} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                            <textarea rows={2} className="input" {...register('address_line1', { required: 'Required' })} />
                            {errors.address_line1 && <p className="text-red-500 text-xs mt-1">{errors.address_line1.message}</p>}
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
                            <input type="text" className="input" {...register('address_line2')} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <Input label="City" error={errors.city?.message} {...register('city', { required: 'Required' })} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <Input label="State" error={errors.state?.message} {...register('state', { required: 'Required' })} />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                            <Input label="Pincode" error={errors.pincode?.message} {...register('pincode', { required: 'Required' })} />
                        </div>
                    </div>

                    <div className="flex items-center mt-4">
                        <input type="checkbox" id="is_default" {...register('is_default')} className="mr-2 rounded text-primary-600 focus:ring-primary-500" />
                        <label htmlFor="is_default" className="text-sm text-gray-700 font-medium">Set as default address</label>
                    </div>

                    <Button type="submit" variant="primary" className="w-full mt-6" isLoading={saving}>
                        {editingId ? "Update Address" : "Save Address"}
                    </Button>
                </form>
            </Modal>
        </div>
    );
};

export default AddressBook;
