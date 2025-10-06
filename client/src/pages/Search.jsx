import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    type: 'all',
    parking: false,
    furnished: false,
    offer: false,
    sort: 'createdAt',
    order: 'desc',
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  // Fetch listings when URL changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const updatedData = {
      searchTerm: urlParams.get('searchTerm') || '',
      type: urlParams.get('type') || 'all',
      parking: urlParams.get('parking') === 'true',
      furnished: urlParams.get('furnished') === 'true',
      offer: urlParams.get('offer') === 'true',
      sort: urlParams.get('sort') || 'createdAt',
      order: urlParams.get('order') || 'desc',
    };
    setSidebarData(updatedData);

    const fetchListings = async () => {
      try {
        setLoading(true);
        setShowMore(false);
        const searchQuery = urlParams.toString();
        const res = await fetch(`https://estate-ease-1-l3ba.onrender.com/api/listing/get?${searchQuery}`);
        const data = await res.json();
        setListings(data || []);
        setShowMore((data || []).length > 8);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    const { id, type, checked, value } = e.target;

    if (id === 'all' || id === 'rent' || id === 'sale') {
      setSidebarData((prev) => ({ ...prev, type: id }));
    } else if (id === 'searchTerm') {
      setSidebarData((prev) => ({ ...prev, searchTerm: value }));
    } else if (id === 'parking' || id === 'furnished' || id === 'offer') {
      setSidebarData((prev) => ({ ...prev, [id]: checked }));
    } else if (id === 'sort_order') {
      const [sort, order] = value.split('_');
      setSidebarData((prev) => ({ ...prev, sort: sort || 'createdAt', order: order || 'desc' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams({
      searchTerm: sidebarData.searchTerm,
      type: sidebarData.type,
      parking: sidebarData.parking,
      furnished: sidebarData.furnished,
      offer: sidebarData.offer,
      sort: sidebarData.sort,
      order: sidebarData.order,
    });
    navigate(`/search?${urlParams.toString()}`);
  };

  const handleShowMore = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      urlParams.set('startIndex', listings.length);
      const res = await fetch(`https://estate-ease-1-l3ba.onrender.com/api/listing/get?${urlParams.toString()}`);
      const data = await res.json();
      setListings((prev) => [...prev, ...(data || [])]);
      if ((data || []).length < 9) setShowMore(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="p-7 border-b-2 md:border-r-2 md:min-h-screen">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap font-semibold">Search Term:</label>
            <input
              type="text"
              id="searchTerm"
              placeholder="Search..."
              className="border rounded-lg p-3 w-full"
              value={sidebarData.searchTerm}
              onChange={handleChange}
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <label className="font-semibold">Type:</label>
            {['all', 'rent', 'sale'].map((t) => (
              <div key={t} className="flex gap-2">
                <input type="checkbox" id={t} className="w-5" onChange={handleChange} checked={sidebarData.type === t} />
                <span>{t === 'all' ? 'Rent & Sale' : t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <input type="checkbox" id="offer" className="w-5" onChange={handleChange} checked={sidebarData.offer} />
              <span>Offer</span>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <label className="font-semibold">Amenities:</label>
            {['parking', 'furnished'].map((amenity) => (
              <div key={amenity} className="flex gap-2">
                <input type="checkbox" id={amenity} className="w-5" onChange={handleChange} checked={sidebarData[amenity]} />
                <span>{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold">Sort:</label>
            <select id="sort_order" defaultValue="createdAt_desc" onChange={handleChange} className="border rounded-lg p-3">
              <option value="regularPrice_desc">Price high to low</option>
              <option value="regularPrice_asc">Price low to high</option>
              <option value="createdAt_desc">Latest</option>
              <option value="createdAt_asc">Oldest</option>
            </select>
          </div>

          <button className="bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95">Search</button>
        </form>
      </div>

      {/* Listings */}
      <div className="flex-1">
        <h1 className="text-3xl font-semibold border-b p-3 text-slate-700 mt-5">Listing results:</h1>
        <div className="p-7 flex flex-wrap gap-4">
          {!loading && listings?.length === 0 && <p className="text-xl text-slate-700">No listing found!</p>}
          {loading && <p className="text-xl text-slate-700 text-center w-full">Loading...</p>}
          {!loading && listings?.map((listing) => <ListingItem key={listing._id} listing={listing} />)}
          {showMore && (
            <button onClick={handleShowMore} className="text-green-700 hover:underline p-7 text-center w-full">
              Show more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
