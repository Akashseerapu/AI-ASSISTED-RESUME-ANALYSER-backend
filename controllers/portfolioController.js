const Portfolio = require("../models/Portfolio");
const User = require("../models/User");

// Helper function to generate unique slug from name
const generateUniqueSlug = async (name) => {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  
  if (!baseSlug) baseSlug = "portfolio";

  let slug = baseSlug;
  let exists = await Portfolio.findOne({ slug });
  let count = 1;

  while (exists) {
    slug = `${baseSlug}-${count}`;
    exists = await Portfolio.findOne({ slug });
    count++;
  }

  return slug;
};

// @desc    Get user's portfolio configuration
// @route   GET /api/portfolio
// @access  Private
exports.getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user.id });

    if (!portfolio) {
      // Create a default portfolio configuration
      const user = await User.findById(req.user.id);
      const slug = await generateUniqueSlug(user.name);

      portfolio = await Portfolio.create({
        userId: req.user.id,
        slug,
        title: `${user.name}'s Showcase`,
        bio: `Hi, I'm ${user.name}. Welcome to my portfolio!`,
        about: "Describe your professional background and passions here.",
        skills: ["Javascript", "React", "Node.js"],
        socialLinks: {
          github: "",
          linkedin: "",
          twitter: "",
          website: ""
        }
      });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching portfolio", error: error.message });
  }
};

// @desc    Update user's portfolio configuration
// @route   PUT /api/portfolio
// @access  Private
exports.updatePortfolio = async (req, res) => {
  try {
    const {
      title,
      bio,
      about,
      skills,
      experience,
      projects,
      education,
      theme,
      profileImage,
      socialLinks,
      isPublic,
      slug
    } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.user.id });

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio configuration not found" });
    }

    // Handle slug change and uniqueness
    if (slug && slug.toLowerCase() !== portfolio.slug) {
      const cleanSlug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const slugExists = await Portfolio.findOne({ slug: cleanSlug, userId: { $ne: req.user.id } });
      if (slugExists) {
        return res.status(400).json({ message: "Portfolio link (slug) is already taken. Please choose another one." });
      }
      portfolio.slug = cleanSlug;
    }

    // Update fields
    portfolio.title = title !== undefined ? title : portfolio.title;
    portfolio.bio = bio !== undefined ? bio : portfolio.bio;
    portfolio.about = about !== undefined ? about : portfolio.about;
    portfolio.skills = skills !== undefined ? skills : portfolio.skills;
    portfolio.experience = experience !== undefined ? experience : portfolio.experience;
    portfolio.projects = projects !== undefined ? projects : portfolio.projects;
    portfolio.education = education !== undefined ? education : portfolio.education;
    portfolio.theme = theme !== undefined ? theme : portfolio.theme;
    portfolio.profileImage = profileImage !== undefined ? profileImage : portfolio.profileImage;
    portfolio.socialLinks = socialLinks !== undefined ? socialLinks : portfolio.socialLinks;
    portfolio.isPublic = isPublic !== undefined ? isPublic : portfolio.isPublic;

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Server error updating portfolio", error: error.message });
  }
};

// @desc    Get a public portfolio by slug
// @route   GET /api/portfolio/public/:slug
// @access  Public
exports.getPublicPortfolio = async (req, res) => {
  try {
    const { slug } = req.params;
    const portfolio = await Portfolio.findOne({ slug: slug.toLowerCase(), isPublic: true })
      .populate("userId", "name email");

    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found or is currently private" });
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching public portfolio", error: error.message });
  }
};
