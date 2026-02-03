import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productsAPI, categoriesAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

const CategoryPage = () => {
    const { type } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // First get relevant category IDs
        const fetchResources = async () => {
            setLoading(true);
            try {
                // Fetch all categories to match the type (ladies, gents, etc)
                const catRes = await categoriesAPI.getAll();
                // Backend 'type' is "Ladies Wear". Frontend param is "ladies".
                // We need to map or search.
                const typeMap = {
                    'ladies': 'Ladies Wear',
                    'gents': 'Gents Wear',
                    'kids': 'Kids Wear'
                };

                const targetType = typeMap[type.toLowerCase()];
                const matchingCats = catRes.data.filter(c => c.type === targetType);

                // Now fetch products. We might need to filter client side if backend doesn't support list of IDs
                // Backend supports `category_id`.
                // Let's fetch all products and filter client side for better UX with small dataset
                // Or loop calls. For now, fetch ALL products and filter.

                const prodRes = await productsAPI.getAll();
                const catIds = matchingCats.map(c => c.id);

                const filtered = prodRes.data.filter(p => catIds.includes(p.category_id));
                setProducts(filtered);
                setCategories(matchingCats);

            } catch (err) {
                console.error("Error fetching category data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchResources();
    }, [type]);

    if (loading) return <div className="container" style={{ padding: '2rem' }}>Loading...</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <h1 style={{ marginBottom: '2rem', textAlign: 'center', textTransform: 'capitalize' }}>{type} Collection</h1>

            {/* Optional Subcategory Filter UI could go here */}

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666' }}>No products found in this category.</div>
            ) : (
                <div className="grid grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
