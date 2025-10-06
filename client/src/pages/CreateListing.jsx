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
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  if (!currentUser) {
    return (
      <p className="text-center mt-10 text-red-600">
        You must be logged in to create a listing.
      </p>
    );
  }

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;

    if (['sale', 'rent'].includes(id)) setFormData({ ...formData, type: id });
    else if (['parking', 'furnished', 'offer'].includes(id))
      setFormData({ ...formData, [id]: checked });
    else setFormData({ ...formData, [id]: value });
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
    if (files.length > 0 && files.length + formData.imageUrls.length <= 6) {
      setUploading(true);
      const promises = Array.from(files).map((file) => storeImage(file));
      Promise.all(promises)
        .then((urls) => {
          setFormData({ ...formData, imageUrls: formData.imageUrls.concat(urls) });
          setUploading(false);
        })
        .catch(() => setUploading(false));
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({ ...formData, imageUrls: formData.imageUrls.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.imageUrls.length < 1) return setError('Upload at least one image');
    if (+formData.regularPrice < +formData.discountPrice)
      return setError('Discount price must be lower than regular price');

    setLoading(true);
    setError(false);

    try {
      const res = await fetch('https://estate-ease-1-l3ba.onrender.com/api/listing/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token}`, // Include token
        },
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
      <h1 className="text-3xl font-semibold text-center my-7">Create a Listing</h1>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        {/* Left side */}
        <div className="flex flex-col gap-4 flex-1">
          <input
            type="text"
            id="name"
            placeholder="Name"
            className="border p-3 rounded-lg"
            minLength={10}
            maxLength={62}
            required
            value={formData.name}
            onChange={handleChange}
          />
          <textarea
            id="description"
            placeholder="Description"
            className="border p-3 rounded-lg"
            required
            value={formData.description}
            onChange={handleChange}
          />
          <input
            type="text"
            id="address"
            placeholder="Address"
            className="border p-3 rounded-lg"
            required
            value={formData.address}
            onChange={handleChange}
          />
          <div className="flex gap-6 flex-wrap">
            {['sale', 'rent', 'parking', 'furnished', 'offer'].map((item) => (
              <div key={item} className="flex gap-2">
                <input
                  type="checkbox"
                  id={item}
                  className="w-5"
                  onChange={handleChange}
                  checked={item === 'sale' || item === 'rent' ? formData.type === item : formData[item]}
                />
                <span>{item.charAt(0).toUpperCase() + item.slice(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side: Images */}
        <div className="flex flex-col flex-1 gap-4">
          <input
            type="file"
            multiple
            accept="image/*"
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
            {loading ? 'Creating...' : 'Create listing'}
          </button>

          {error && <p className="text-red-700 text-sm">{error}</p>}
        </div>
      </form>
    </main>
  );
}
