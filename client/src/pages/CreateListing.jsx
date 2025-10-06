import { useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    imageUrls: [],
    name: '',
    description: '',
    address: '',
    type: 'rent',
    bedrooms: 1,
    bathrooms: 1,
    regularPrice: 50,
    discountPrice: 0,
    offer: false,
    parking: false,
    furnished: false,
  });
  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!currentUser || !currentUser.token) {
    return (
      <p className="text-center mt-10 text-red-600">
        You must be logged in to create a listing.
      </p>
    );
  }

  const handleChange = (e) => {
    const { id, type, value, checked } = e.target;
    if (['sale', 'rent'].includes(id)) {
      setFormData({ ...formData, type: id });
    } else if (['parking', 'furnished', 'offer'].includes(id)) {
      setFormData({ ...formData, [id]: checked });
    } else if (['text', 'number', 'textarea'].includes(type)) {
      setFormData({ ...formData, [id]: value });
    }
  };

  const storeImage = (file) =>
    new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        reject,
        () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
      );
    });

  const handleImageSubmit = () => {
    if (files.length === 0 || files.length + formData.imageUrls.length > 6) {
      setImageUploadError('You can upload up to 6 images.');
      return;
    }
    setUploading(true);
    Promise.all(Array.from(files).map(storeImage))
      .then((urls) => {
        setFormData({ ...formData, imageUrls: [...formData.imageUrls, ...urls] });
        setUploading(false);
        setImageUploadError(false);
      })
      .catch(() => {
        setUploading(false);
        setImageUploadError('Failed to upload images (max 2MB each).');
      });
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.imageUrls.length < 1) return setError('Upload at least one image.');
    if (+formData.discountPrice > +formData.regularPrice)
      return setError('Discount price must be lower than regular price.');

    setLoading(true);
    setError(false);

    try {
      const res = await fetch('https://estate-ease-1-l3ba.onrender.com/api/listing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`, // Token added
        },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) return setError(data.message || 'Failed to create listing');

      navigate(`/listing/${data._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">Create a Listing</h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        {/* Left side: listing info */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            id="name"
            placeholder="Name"
            minLength={10}
            maxLength={62}
            required
            value={formData.name}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          />
          <textarea
            id="description"
            placeholder="Description"
            required
            value={formData.description}
            onChange={handleChange}
            className="border p-3 rounded-lg"
          />
          <input
            type="text"
            id="address"
            placeholder="Address"
