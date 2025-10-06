import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

// ✅ Create a listing (requires auth)
export const createListing = async (req, res, next) => {
  try {
    // req.user is set by verifyToken middleware
    if (!req.user || !req.user.id) return next(errorHandler(401, 'Unauthorized'));

    // Attach logged-in user to the listing
    const listing = await Listing.create({
      ...req.body,
      userRef: req.user.id,
    });

    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a listing
export const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return next(errorHandler(404, 'Listing not found!'));
    if (req.user.id !== listing.userRef.toString())
      return next(errorHandler(401, 'You can only delete your own listings!'));

    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

// ✅ Update a listing
export const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found!'));
    if (req.user.id !== listing.userRef.toString())
      return next(errorHandler(401, 'You can only update your own listings!'));

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

// ✅ Get a single listing
export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(errorHandler(404, 'Listing not found!'));
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

// ✅ Get multiple listings with filters
export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;

    const offer = req.query.offer === 'true' ? true : { $in: [false, true] };
    const furnished = req.query.furnished === 'true' ? true : { $in: [false, true] };
    const parking = req.query.parking === 'true' ? true : { $in: [false, true] };
    const type = req.query.type && req.query.type !== 'all' ? req.query.type : { $in: ['sale', 'rent'] };
    const searchTerm = req.query.searchTerm || '';
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const listings = await Listing.find({
      name: { $regex: searchTerm, $options: 'i' },
      offer,
      furnished,
      parking,
      type,
    })
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};
