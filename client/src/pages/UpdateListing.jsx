import { useEffect, useState } from 'react';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';
import { app } from '../firebase';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

export default function CreateListing() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { listingId } = useParams();

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
  const [imageUploadError, setImageUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch listing for editing
  useEffect(() => {
    if (!listingId) return;
    const fetchListing = async () => {
      try {
        const res = await fetch(`https://estate-ease-1-l3ba.onrender.com/api/listing/update/${listingId}`);
        const data = await res.json();
        if (data.success === false) return console.log(data.message);
        setFormData(data);
      } catch (err) {
        console.log(err.message);
      }
    };
    fetchListing();
  }, [listingId]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [id]: checked });
    } else {
      setFormData({ ...formData, [id]: value });
    }
  };

  // Upload Images
  const storeImage = (file) =>
    new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload ${file.name}: ${Math.round(progress)}%`);
        },
        (err) => reject(err),
        () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
      );
    });

  const handleImageSubmit = async () => {
    if (!files.length || files.length + formData.imageUrls.length > 6) {
      setImageUploadError('You can upload up to 6 images only');
      return;
    }

    setUploading(true);
    setImageUploadError('');
    try {
      const urls = await Promise.all(Array.from(files).map(storeImage));
      setFormData({ ...formData, imageUrls: [...formData.imageUrls, ...urls] });
    } catch {
      setImageUploadError('Image upload failed (max 2MB per image)');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({ ...formData, imageUrls: formData.imageUrls.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.imageUrls.length < 1) return setError('Upload at least one image');
    if (formData.discountPrice > formData.regularPrice)
      return setError('Discount price must be lower than regular price');

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`https://estate-ease-1-l3ba.onrender.com/api/listing/update/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, userRef: currentUser._id }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.success === false) return setError(data.message);
      navigate(`/listing/${data._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="p-3 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        {listingId ? 'Update Listing' : 'Create Listing'}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        {/* Listing Details */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            id="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="border p-3 rounded-lg"
            required
            maxLength={62}
            minLength={10}
          />
          <textarea
            id="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            className="border p-3 rounded-lg"
            required
          />
          <input
            type="text"
            id="address"
            placeholder="Address"
            value={formData.address}
            onChange={handleChange}
            className="border p-3 rounded-lg"
            required
          />
          <div className="flex gap-6 flex-wrap">
            {['sale', 'rent', 'parking', 'furnished', 'offer'].map((field) => (
              <div key={field} className="flex gap-2">
                <input
                  type="checkbox"
                  id={field}
                  checked={formData[field]}
                  onChange={handleChange}
                  className="w-5"
                />
                <span>{field.charAt(0).toUpperCase() + field.slice(1)}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            {['bedrooms', 'bathrooms', 'regularPrice', 'discountPrice'].map((field) => (
              <div key={field} className="flex flex-col gap-2">
                <input
                  type="number"
                  id={field}
                  value={formData[field]}
                  onChange={handleChange}
                  min={field === 'regularPrice' || field === 'discountPrice' ? 0 : 1}
                  className="p-3 border border-gray-300 rounded-lg"
                  required
                />
                <p className="capitalize">{field.replace('Price', ' Price')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold">
            Images: <span className="font-normal text-gray-600">(First image is cover, max 6)</span>
          </p>
          <div className="flex gap-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="p-3 border border-gray-300 rounded w-full"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={handleImageSubmit}
              className="p-3 text-green-700 border border-green-700 rounded uppercase hover:shadow-lg disabled:opacity-80"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          {imageUploadError && <p className="text-red-700 text-sm">{imageUploadError}</p>}
          {formData.imageUrls.map((url, i) => (
            <div key={i} className="flex justify-between p-3 border items-center">
              <img src={url} alt="listing" className="w-20 h-20 object-contain rounded-lg" />
              <button
                type="button"
                onClick={() => handleRemoveImage(i)}
                className="p-3 text-red-700 rounded-lg uppercase hover:opacity-75"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            type="submit"
            disabled={loading || uploading}
            className="p-3 bg-slate-700 text-white rounded-lg uppercase hover:opacity-95 disabled:opacity-80"
          >
            {loading ? 'Saving...' : listingId ? 'Update Listing' : 'Create Listing'}
          </button>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
