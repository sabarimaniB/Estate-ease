import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import SwiperCore from 'swiper';
import 'swiper/css/bundle';
import ListingItem from '../components/ListingItem';

export default function Home() {
  const [offerListings, setOfferListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [loading, setLoading] = useState(true);

  SwiperCore.use([Navigation]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const [offersRes, rentRes, saleRes] = await Promise.all([
          fetch(
            'https://estate-ease-1-l3ba.onrender.com/api/listing/get?offer=true&limit=4',
            { credentials: 'include' }
          ),
          fetch(
            'https://estate-ease-1-l3ba.onrender.com/api/listing/get?type=rent&limit=4',
            { credentials: 'include' }
          ),
          fetch(
            'https://estate-ease-1-l3ba.onrender.com/api/listing/get?type=sale&limit=4',
            { credentials: 'include' }
          ),
        ]);

        if (!offersRes.ok || !rentRes.ok || !saleRes.ok) {
          console.error('Failed to fetch some listings');
          setLoading(false);
          return;
        }

        const [offersData, rentData, saleData] = await Promise.all([
          offersRes.json(),
          rentRes.json(),
          saleRes.json(),
        ]);

        setOfferListings(offersData || []);
        setRentListings(rentData || []);
        setSaleListings(saleData || []);
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading listings...</p>;

  return (
    <div>
      {/* Top Section */}
      <div className="flex flex-col gap-6 p-28 px-3 max-w-6xl mx-auto">
        <h1 className="text-slate-700 font-bold text-3xl lg:text-6xl">
          Find your next <span className="text-slate-500">perfect</span>
          <br />
          place with ease
        </h1>
        <div className="text-gray-400 text-xs sm:text-sm">
          Estate-Ease is the best place to find your next perfect place to live.
          <br />
          We have a wide range of properties for you to choose from.
        </div>
        <Link
          to={'/search'}
          className="text-xs sm:text-sm text-blue-800 font-bold hover:underline"
        >
          Let get started...
        </Link>
      </div>

      {/* Swiper */}
      {offerListings.length > 0 && (
        <Swiper navigation>
          {offerListings.map((listing) => (
            <SwiperSlide key={listing._id}>
              <div
                style={{
                  background: `url(${listing.imageUrls?.[0] || '/placeholder.jpg'}) center no-repeat`,
                  backgroundSize: 'cover',
                }}
                className="h-[500px]"
              ></div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Listing Sections */}
      <div className="max-w-6xl mx-auto p-3 flex flex-col gap-8 my-10">
        {/* Offers */}
        {offerListings.length > 0 && (
          <div>
            <div className="my-3 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-slate-600">
                Recent offers
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search?offer=true'}
              >
                Show more offers
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {offerListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {/* Rent */}
        {rentListings.length > 0 && (
          <div>
            <div className="my-3 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-slate-600">
                Recent places for rent
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search?type=rent'}
              >
                Show more places for rent
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {rentListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}

        {/* Sale */}
        {saleListings.length > 0 && (
          <div>
            <div className="my-3 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-slate-600">
                Recent places for sale
              </h2>
              <Link
                className="text-sm text-blue-800 hover:underline"
                to={'/search?type=sale'}
              >
                Show more places for sale
              </Link>
            </div>
            <div className="flex flex-wrap gap-4">
              {saleListings.map((listing) => (
                <ListingItem listing={listing} key={listing._id} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
