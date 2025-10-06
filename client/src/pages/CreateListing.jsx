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

  if (!currentUser) {
    return (
      <p className="text-center mt-10 text-red-600">
        You must be logged in to create a listing.
      </p>
    );
  }

  const handleImageSubmit = (e) => {
    if (files.length > 0 && files.length + formData.imageUrls.length < 7) {
      setUploading(true);
      setImageUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }

      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setImageUploadError(false);
          setUploading(false);
        })
        .catch(() => {
          setImageUploadError('Image upload failed (2 MB max per image)');
          setUploading(false);
        });
    } else {
      setImageUploadError('You can only upload up to 6 images per listing');
      setUploading(false);
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
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(resolve);
        }
      );
    });

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;

    if (['sale', 'rent'].includes(id)) {
      setFormData({ ...formData, type: id });
    } else if (['parking', 'furnished', 'offer'].includes(id)) {
      setFormData({ ...formData, [id]: checked });
    } else if (['number', 'text', 'textarea'].includes(type)) {
      setFormData({ ...formData, [id]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.imageUrls.length < 1) return setError('You must upload at least one image');
      if (+formData.regularPrice < +formData.discountPrice)
        return setError('Discount price must be lower than regular price');

      setLoading(true);
      setError(false);

      const res = await fetch('https://estate-ease-1-l3ba.onrender.com/api/listing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`, // ✅ Add auth token here
        },
        body: JSON.stringify({
          ...formData,
          userRef: currentUser._id,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
        return;
      }

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
        {/* Form left side: Details */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            placeholder="Name"
            id="name"
            className="border p-3 rounded-lg"
            required
            minLength={10}
            maxLength={62}
            onChange={handleChange}
            value={formData.name}
          />
          <textarea
            placeholder="Description"
            id="description"
            className="border p-3 rounded-lg"
            required
            onChange={handleChange}
            value={formData.description}
          />
          <input
            type="text"
            placeholder="Address"
            id="address"
            className="border p-3 rounded-lg"
            required
            onChange={handleChange}
            value={formData.address}
          />
          {/* Type & checkboxes */}
          <div className="flex gap-6 flex-wrap">
            {['sale', 'rent', 'parking', 'furnished', 'offer'].map((item) => (
              <div key={item} className="flex gap-2">
                <input
                  type="checkbox"
                  id={item}
                  className="w-5"
                  onChange={handleChange}
                  checked={
                    item === 'sale' || item === 'rent'
                      ? formData.type === item
                      : formData[item]
                  }
                />
                <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Form right side: Images */}
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold">
            Images:
            <span className="font-normal text-gray-600 ml-2">First image is cover (max 6)</span>
          </p>
          <div className="flex gap-4">
            <input
              type="file"
              accept="image/*"
              multiple
              className="p-3 border border-gray-300 rounded w-full"
              onChange={(e) => setFiles(e.target.files)}
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
          {formData.imageUrls.map((url, i) => (
            <div key={url} className="flex justify-between p-3 border items-center">
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
            {loading ? 'Creating...' : 'Create listing'}
          </button>
          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
