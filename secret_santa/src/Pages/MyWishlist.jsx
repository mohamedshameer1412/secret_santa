import React, { useState, useEffect } from "react";
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';

const MyWishlist = () => {
    const [wishlist, setWishlist] = useState([
        {
            id: 1,
            title: "A Good Book",
            description: "Any motivational or fiction novel.",
            link: "https://www.goodreads.com/",
            image: "https://covers.openlibrary.org/b/id/10594762-L.jpg",
            important: false
        },
        {
            id: 2,
            title: "Cozy Socks",
            description: "Warm and soft socks for winter.",
            link: "",
            image: "https://i.pravatar.cc/400?img=69",
            important: false
        },
    ]);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [newItem, setNewItem] = useState({ title: "", description: "", link: "", image: "", important: false });
    const [editItemId, setEditItemId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (editItemId !== null) {
            const item = wishlist.find((item) => item.id === editItemId);
            if (item) setNewItem(item);
        } else {
            setNewItem({ title: "", description: "", link: "", image: "", important: false });
        }
    }, [editItemId, wishlist]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setNewItem((prev) => ({ ...prev, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const openModal = () => setShowModal(true);
    
    const closeModal = () => {
        setShowModal(false);
        setEditItemId(null);
        setNewItem({ title: "", description: "", link: "", image: "", important: false });
    };

    const handleAddOrUpdate = () => {
        if (!newItem.title.trim()) return alert("Please enter a title.");
        if (editItemId) {
            setWishlist((prev) =>
                prev.map((item) => (item.id === editItemId ? { ...item, ...newItem } : item))
            );
        } else {
            setWishlist((prev) => [...prev, { id: Date.now(), ...newItem }]);
        }
        closeModal();
    };

    const handleEdit = (item) => {
        setEditItemId(item.id);
        openModal();
    };

    const handleDelete = (id) => {
        setWishlist((prev) => prev.filter((item) => item.id !== id));
    };

    const toggleImportant = (id) => {
        setWishlist((prev) =>
            prev
                .map((item) => (item.id === id ? { ...item, important: !item.important } : item))
                .sort((a, b) => b.important - a.important)
        );
    };

    return (
        <div className="d-flex flex-column w-100 vh-100">
            <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="d-flex flex-grow-1">
                <Sidebar isOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className={`content ${sidebarOpen ? '' : 'shifted'} flex-grow-1`} style={{ marginTop: '56px' }}>
                    <div className="container my-5">
                        <div className="p-4 rounded-4 shadow-sm"
                            style={{
                                background: "rgba(255,255,255,0.75)",
                                backdropFilter: "blur(12px)",
                                border: "1px solid rgba(255,255,255,0.4)",
                                boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                            }}>
                            <h3 className="fw-bold mb-2 d-flex align-items-center flex-wrap">
                                <i className="fas fa-gift text-danger me-2"></i> My Wishlist
                            </h3>
                            <p className="text-muted mb-4">
                                Mark the most important gifts with <i className="fas fa-star text-warning"></i> so your Secret Santa knows what matters most!
                            </p>

                            {/* Wishlist Items */}
                            <ul className="list-group mb-4">
                                {wishlist.map((item) => (
                                    <li key={item.id}
                                        className="list-group-item border-0 mb-3 rounded shadow-sm p-3 d-flex flex-column flex-sm-row align-items-center gap-3"
                                        style={{
                                            background: item.important
                                                ? "rgba(255, 250, 200, 0.85)"
                                                : "rgba(255,255,255,0.85)",
                                            backdropFilter: "blur(10px)",
                                            transition: "all 0.3s ease"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)"}
                                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"}
                                    >
                                        {/* Image Section */}
                                        <div className="text-center" style={{ flexShrink: 0 }}>
                                            <img
                                                src={item.image || "https://via.placeholder.com/120"}
                                                alt={item.title}
                                                className="rounded shadow-sm"
                                                style={{ width: "120px", height: "120px", objectFit: "cover" }}
                                            />
                                        </div>

                                        {/* Info Section */}
                                        <div className="flex-grow-1 text-center text-sm-start">
                                            <h6 className="fw-semibold mb-1">
                                                {item.title}{" "}
                                                {item.important && (
                                                    <i className="fas fa-star text-warning"></i>
                                                )}
                                            </h6>
                                            <p className="text-muted mb-1" style={{ fontSize: "14px" }}>
                                                {item.description}
                                            </p>
                                            {item.link && (
                                                <a href={item.link} target="_blank" rel="noopener noreferrer"
                                                    className="text-decoration-none text-primary"
                                                    style={{ fontSize: "13px" }}>
                                                    <i className="fas fa-link me-1"></i> {new URL(item.link).hostname}
                                                </a>
                                            )}
                                        </div>

                                        {/* Buttons Section */}
                                        <div className="d-flex flex-sm-column flex-row gap-2 justify-content-center align-items-center">
                                            <button
                                                className={`btn btn-sm ${item.important ? "btn-warning" : "btn-outline-warning"}`}
                                                title="Mark as Important"
                                                onClick={() => toggleImportant(item.id)}
                                            >
                                                <i className="fas fa-star"></i>
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>

                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Add New Item */}
                            <button className="btn btn-danger w-100"
                                style={{
                                    borderRadius: "10px",
                                    boxShadow: "0 3px 12px rgba(220,0,0,0.3)",
                                    transition: "all 0.3s ease"
                                }}
                                onMouseEnter={(e) => e.target.style.boxShadow = "0 4px 16px rgba(220,0,0,0.5)"}
                                onMouseLeave={(e) => e.target.style.boxShadow = "0 3px 12px rgba(220,0,0,0.3)"}
                                onClick={() => { setEditItemId(null); openModal(); }}>
                                <i className="fas fa-plus me-2"></i>Add New Item
                            </button>
                        </div>

                        {/* Modal - React-controlled instead of Bootstrap JS */}
                        {showModal && (
                            <>
                                {/* Backdrop */}
                                <div 
                                    className="modal-backdrop fade show" 
                                    onClick={closeModal}
                                    style={{ zIndex: 1040 }}
                                ></div>
                                
                                {/* Modal */}
                                <div 
                                    className="modal fade show d-block" 
                                    tabIndex="-1" 
                                    style={{ zIndex: 1050 }}
                                >
                                    <div className="modal-dialog modal-dialog-centered">
                                        <div className="modal-content shadow-sm">
                                            <div className="modal-header">
                                                <h5 className="modal-title">{editItemId ? "Edit Item" : "Add New Item"}</h5>
                                                <button type="button" className="btn-close" onClick={closeModal}></button>
                                            </div>
                                            <div className="modal-body">
                                                <div className="form-floating mb-2">
                                                    <input type="text" className="form-control" placeholder="Title"
                                                        value={newItem.title}
                                                        onChange={(e) => setNewItem({ ...newItem, title: e.target.value })} />
                                                    <label><i className="fas fa-tag me-2"></i>Item Title</label>
                                                </div>

                                                <div className="form-floating mb-2">
                                                    <textarea className="form-control" placeholder="Description" style={{ height: "80px" }}
                                                        value={newItem.description}
                                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}>
                                                    </textarea>
                                                    <label><i className="fas fa-pen me-2"></i>Description</label>
                                                </div>

                                                <div className="form-floating mb-2">
                                                    <input type="url" className="form-control" placeholder="Optional link"
                                                        value={newItem.link}
                                                        onChange={(e) => setNewItem({ ...newItem, link: e.target.value })} />
                                                    <label><i className="fas fa-link me-2"></i>Product URL</label>
                                                </div>

                                                <div className="form-floating mb-2">
                                                    <input type="url" className="form-control" placeholder="Image URL"
                                                        value={newItem.image}
                                                        onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} />
                                                    <label><i className="fas fa-image me-2"></i>Image URL</label>
                                                </div>

                                                <div className="form-group mb-2">
                                                    <label className="form-label fw-semibold">
                                                        <i className="fas fa-upload me-2"></i>Upload Image
                                                    </label>
                                                    <input type="file" className="form-control" accept="image/*" onChange={handleImageUpload} />
                                                </div>

                                                {newItem.image && (
                                                    <div className="text-center mt-3">
                                                        <img src={newItem.image} alt="Preview"
                                                            className="rounded shadow-sm"
                                                            style={{ width: "120px", height: "120px", objectFit: "cover" }} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="modal-footer">
                                                <button className="btn btn-secondary" onClick={closeModal}>
                                                    Cancel
                                                </button>
                                                <button className="btn btn-danger" onClick={handleAddOrUpdate}>
                                                    <i className="fas fa-check me-2"></i>{editItemId ? "Update" : "Add"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MyWishlist;