const Category = require("../../model/category/Category");
const expressAsyncHandler = require("express-async-handler");

const validateMongodbId = require("../../utils/validateMongodbID");

const createCategoryCtrl = expressAsyncHandler(async (req, res) => {
  //console.log(req.user)
  try {
    const category = await Category.create({
      user: req.user._id,
      title: req.body.title,
    });
    res.json(category);
  } catch (error) {
    res.json(error.message);
  }
});

const fetchCategoriesCtrl = expressAsyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({})
      .populate("user")
      .sort("-createdAt");
    res.json(categories);
  } catch (error) {
    res.json(error);
  }
});

const fetchCategoryCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id)
      .populate("user")
      .sort("-createdAt");
    res.json(category);
  } catch (error) {
    res.json(error);
  }
});

const updateCategoryCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;

  validateMongodbId(id);

  try {
    const foundCategory = await Category.findByIdAndUpdate(
      id,
      {
        title: req.body.title,
      },
      { new: true, runValidators: true }
    );

    res.json(foundCategory);
  } catch (error) {
    res.json(error);
  }
});

const deleteCategoryCtrl = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongodbId(id);

  try {
    const category = await Category.findByIdAndDelete(id);
    res.json({
      message: "deleted successfully",
      category: category,
    });
  } catch (error) {
    res.json(error);
  }
});

module.exports = {
  createCategoryCtrl,
  fetchCategoriesCtrl,
  fetchCategoryCtrl,
  updateCategoryCtrl,
  deleteCategoryCtrl,
};
