import React from 'react';

const About = () => {
    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--primaryIconOrText)' }}>About Burhani Collection</h1>

            <div style={{ lineHeight: '1.8', fontSize: '1.1rem', color: '#444' }}>
                <p style={{ marginBottom: '1rem' }}>
                    Welcome to <strong>Burhani Collection</strong>, your premium destination for exquisite ladies', gents', and kids' wear.
                    We are dedicated to providing you with the very best of fashion, with an emphasis on quality, elegance, and customer satisfaction.
                </p>

                <p style={{ marginBottom: '1rem' }}>
                    Founded in 2026, Burhani Collection has come a long way from its beginnings. When we first started out, our passion for
                    "Fashion for Everyone" drove us to start our own business.
                </p>

                <p style={{ marginBottom: '1rem' }}>
                    We hope you enjoy our products as much as we enjoy offering them to you. If you have any questions or comments,
                    please don't hesitate to contact us.
                </p>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Our Promise</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
                        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Quality</h4>
                            <p style={{ fontSize: '0.9rem' }}>Hand-picked fabrics and premium stitching.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Style</h4>
                            <p style={{ fontSize: '0.9rem' }}>Trending designs for the modern look.</p>
                        </div>
                        <div style={{ padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--primary)' }}>Service</h4>
                            <p style={{ fontSize: '0.9rem' }}>Dedicated support for a seamless experience.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
