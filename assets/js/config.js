/**
 * CHRIST EMBASSY NEW BENIN — CENTRALIZED CONFIGURATION (CEC_CONFIG)
 * Church of Excellence | Pastor Joseph Atibi-Brown
 * 
 * All church content, service schedules, pastoral information, ministries,
 * events, sermons, and contact details are managed here.
 * Update any value in this file to reflect changes across the entire website.
 */

const CEC_CONFIG = {
  // 1. BRAND & LOCAL CHURCH IDENTITY
  church: {
    name: "Christ Embassy New Benin",
    tagline: "Church of Excellence",
    welcomeHeading: "Welcome to Christ Embassy New Benin",
    welcomeStatement: "Welcome to Christ Embassy New Benin with Pastor Joseph Atibi-Brown",
    subtitle: "Where God’s Word transforms lives and destinies.",
    localDescription: "Christ Embassy New Benin is a local church of the Christ Embassy ministry and a vibrant family of believers committed to God's Word, worship, fellowship, spiritual growth, evangelism and community service.",
    parentMinistry: {
      name: "Christ Embassy",
      officialWebsite: "https://christembassy.org/",
      globalPresident: "Rev. Dr. Chris Oyakhilome",
      presidentTitle: "President of Christ Embassy"
    },
    logo: {
      image: "assets/uploaded_media/cec_newbenin_church_logo_1.png",
      svg: "logo.svg",
      alt: "Christ Embassy Church Official Logo"
    },
    proofPillars: [
      { label: "Word Centered", desc: "Rooted in the eternal truths of the Gospel" },
      { label: "Spirit Led", desc: "Walking in supernatural faith and divine love" },
      { label: "Christ Embassy Family", desc: "A home of warmth, excellence, and fellowship" },
      { label: "Local Impact", desc: "Transforming destinies across our community" }
    ]
  },

  // 2. PASTORAL LEADERSHIP
  // CRITICAL: Pastor Joseph Atibi-Brown is the pastor of the local church (Christ Embassy New Benin),
  // not the President, Founder, or Global Leader of the wider Christ Embassy ministry.
  pastor: {
    name: "Pastor Joseph Atibi-Brown",
    title: "Pastor, Christ Embassy New Benin",
    roleDescription: "Pastor Joseph Atibi-Brown serves as the pastor of Christ Embassy New Benin, providing pastoral care, teaching God's Word, and leading the local congregation in fulfilling God's divine purpose.",
    image: "assets/images/image_07.jpg", // High quality portrait from authentic assets
    alt: "Pastor Joseph Atibi-Brown, Pastor of Christ Embassy New Benin",
    shortBio: "Under the spiritual leadership and teaching of Pastor Joseph Atibi-Brown, Christ Embassy New Benin has continued to grow as a pillar of spiritual excellence, equipping believers with the Gospel of Jesus Christ and demonstrating the miraculous character of the Spirit.",
    fullBioPlaceholder: "[Pastor Joseph Atibi-Brown Full Biography — To Be Supplied by Church Office]"
  },

  // 3. OFFICIAL CHRIST EMBASSY VISION & OUR LOCAL EXPRESSION
  vision: {
    // Official wider ministry vision (unaltered from official Christ Embassy sources)
    officialVisionTitle: "Official Christ Embassy Vision",
    officialVisionText: "To take the divine presence of God to the nations and peoples of the world; and to demonstrate the character of the Spirit.",
    officialSource: "https://christembassy.org/",

    // Local church expression (how New Benin participates in the global vision)
    localExpressionTitle: "Our Local Expression",
    localExpressionText: "Christ Embassy New Benin is part of the wider Christ Embassy ministry and expresses this vision through our local church family. We are committed to reaching people with God's Word, building a vibrant community of believers, encouraging spiritual growth, supporting evangelism, and helping people live out God's purpose for their lives.",
    
    // Living out the vision themes reflected in local church activities
    themes: [
      { icon: "menu_book", title: "God's Word", desc: "Uncompromising biblical teaching that builds unshakeable faith and divine character." },
      { icon: "volunteer_activism", title: "Love & Fellowship", desc: "A welcoming, gracious family where every individual is valued and nurtured." },
      { icon: "grade", title: "Excellence", desc: "Pursuing the highest standard of spiritual, moral, and operational integrity in all we do." },
      { icon: "public", title: "Evangelism", desc: "Passionate soul-winning, local outreaches, and carrying the Gospel into every sphere." },
      { icon: "trending_up", title: "Spiritual Growth", desc: "Discipleship, Foundation School classes, and mentoring believers to reign in life." },
      { icon: "diversity_3", title: "Community Service", desc: "Impacting families and neighborhoods with the practical love of Jesus Christ." }
    ]
  },

  // 4. HERO SLIDESHOW (Using verified authentic congregation & pastor photos)
  heroSlides: [
    {
      image: "assets/images/image_03.jpg",
      alt: "Pastor Joseph Atibi-Brown in prayer before the sanctuary and congregation",
      title: "Welcome to Christ Embassy New Benin",
      subtitle: "Experience God’s Word, grow in faith, discover your purpose, and transform your world with Pastor Joseph Atibi-Brown.",
      primaryAction: { text: "Watch Live", href: "#live" },
      secondaryAction: { text: "Plan Your Visit", href: "#visit" }
    },
    {
      image: "assets/images/image_04.jpg",
      alt: "Woman worshipper deep in heartfelt adoration and praise",
      title: "Church of Excellence",
      subtitle: "A vibrant family church where the presence of God is tangible and every soul is empowered to walk in victory.",
      primaryAction: { text: "Join Us Live", href: "#live" },
      secondaryAction: { text: "Explore Ministries", href: "#ministries" }
    },
    {
      image: "assets/images/image_05.jpg",
      alt: "Pastor Joseph Atibi-Brown on his knees in prayer",
      title: "Where God's Word Transforms Lives",
      subtitle: "Immerse yourself in triumphant worship, life-changing revelations, and supernatural fellowship.",
      primaryAction: { text: "Watch Sermons", href: "#sermons" },
      secondaryAction: { text: "Partner With Us", href: "#give" }
    },
    {
      image: "assets/images/image_14.jpg",
      alt: "Vibrant sanctuary auditorium illuminated with blue lights during worship",
      title: "Discover Your Kingdom Purpose",
      subtitle: "Connecting you with God's divine destiny and a thriving community of passionate believers.",
      primaryAction: { text: "Plan a Visit", href: "#visit" },
      secondaryAction: { text: "Get In Touch", href: "#contact" }
    }
  ],

  // 5. CURRENT FOCUS / FEATURED BANNER
  currentFocus: {
    category: "LOCAL",
    eyebrow: "Featured Church Focus",
    title: "[Special Church Service & Spiritual Breakthrough Meeting — To Be Supplied]",
    subtitle: "Join Pastor Joseph Atibi-Brown and the Christ Embassy New Benin family for a special season of the Word, impartation, and blessings.",
    eventDate: "[Event Date — To Be Supplied]",
    linkText: "Learn More",
    linkHref: "#events",
    image: "assets/images/image_15.jpg",
    alt: "Congregation praising joyfully during service"
  },

  // 6. OUR SERVICES & SCHEDULE
  // NO INVENTED TIMES: Clean editable placeholders used until church provides official schedule
  services: [
    {
      id: "sunday-service",
      day: "Sunday Service",
      focus: "Worship • Word • Fellowship",
      time: "[Sunday Service Time — To Be Supplied]",
      location: "[Church Auditorium — To Be Supplied]",
      description: "Our flagship weekend celebration featuring uplifting praise, worship, prophetic ministry, and teaching from Pastor Joseph Atibi-Brown.",
      tag: "Weekly Celebration",
      image: "assets/images/image_13.jpg"
    },
    {
      id: "midweek-service",
      day: "Wednesday Service",
      focus: "Midweek Bible Study & Prayer",
      time: "[Midweek Service Time — To Be Supplied]",
      location: "[Church Auditorium — To Be Supplied]",
      description: "Midweek spiritual recharge with in-depth study of the scriptures, corporate intercession, and fellowship.",
      tag: "Midweek Strength",
      image: "assets/images/image_11.jpg"
    },
    {
      id: "special-services",
      day: "Special Services",
      focus: "All-Night Prayers & Special Programs",
      time: "[Details & Dates — To Be Supplied]",
      location: "[Church Auditorium / Online — To Be Supplied]",
      description: "Monthly communion services, prayer vigils, faith conferences, and special ministry assemblies.",
      tag: "Special Gatherings",
      image: "assets/images/image_17.jpg"
    }
  ],

  // 7. OUR MINISTRIES (All descriptions editable, featuring authentic imagery)
  ministries: [
    {
      id: "childrens-church",
      name: "Children's Church",
      category: "LOCAL",
      subtitle: "Building Faith Early",
      description: "A joyful, secure environment where children learn God's Word through age-tailored Bible lessons, interactive praise, and creative activities.",
      image: "assets/images/image_09.jpg",
      learnMoreText: "Our dedicated teachers shepherd our children to know Jesus, pray effectively, and shine as lights in their schools."
    },
    {
      id: "teens-church",
      name: "Teens Church",
      category: "LOCAL",
      subtitle: "Passionate & Purposeful",
      description: "Empowering adolescents and teenagers to navigate life with biblical confidence, godly character, and peer fellowship.",
      image: "assets/images/image_12.jpg",
      learnMoreText: "Dynamic youth discussions, teen rallies, academic excellence mentorship, and spirited praise sessions."
    },
    {
      id: "youth-ministry",
      name: "Youth Ministry",
      category: "LOCAL",
      subtitle: "Young Adults on Fire",
      description: "Equipping young professionals, university students, and creators to lead boldly and influence society through Kingdom values.",
      image: "assets/images/image_16.jpg",
      learnMoreText: "Career workshops, leadership seminars, campus outreaches, and dynamic spiritual retreats."
    },
    {
      id: "foundation-school",
      name: "Foundation School",
      category: "LOCAL",
      subtitle: "Spiritual Discipleship",
      description: "Systematic foundational training for new converts and members to understand Christian doctrines, the Holy Spirit, and soul-winning.",
      image: "assets/images/image_10.jpg",
      learnMoreText: "Structured curriculum designed to ground every believer firmly in the revelations of Christ and church ministry."
    },
    {
      id: "womens-ministry",
      name: "Women's Ministry",
      category: "LOCAL",
      subtitle: "Daughters of Excellence",
      description: "Fostering sisterhood, spiritual maturity, family harmony, and community impact among women of all ages.",
      image: "assets/images/image_04.jpg",
      learnMoreText: "Regular fellowship meetings, health and domestic wellness workshops, and prayer networks."
    },
    {
      id: "mens-ministry",
      name: "Men's Ministry",
      category: "LOCAL",
      subtitle: "Pillars of Faith & Honor",
      description: "Mobilizing Christian men to be godly leaders in their homes, businesses, and society through brotherhood and accountability.",
      image: "assets/images/image_06.jpg",
      learnMoreText: "Men's breakfast summits, enterprise coaching, and evangelistic community projects."
    },
    {
      id: "music-choir",
      name: "Music & Choir",
      category: "LOCAL",
      subtitle: "Heavenly Harmonies & Worship",
      description: "Anointed psalmists and instrumentalists ministering in heavenly praise, divine atmosphere, and spiritual anthems.",
      image: "assets/images/image_08.jpg",
      learnMoreText: "Leading the congregation into deep adoration and crafting spiritual songs that minister healing and deliverance."
    },
    {
      id: "outreach-evangelism",
      name: "Outreach & Evangelism",
      category: "LOCAL",
      subtitle: "Soul-Winning Army",
      description: "Taking the Gospel to streets, markets, hospitals, and communities with tract distribution and salvation crusades.",
      image: "assets/images/image_14.jpg",
      learnMoreText: "Organized cell groups, city-wide evangelical blitzes, and neighborhood visitation programs."
    },
    {
      id: "prayer-ministry",
      name: "Prayer Ministry",
      category: "LOCAL",
      subtitle: "Watchmen on the Wall",
      description: "Unceasing corporate and personal intercession for the saints, church leadership, community, and global Gospel advancement.",
      image: "assets/images/image_05.jpg",
      learnMoreText: "24/7 prayer chains, vigil sessions, and dedicated prayer counseling for specific needs."
    }
  ],

  // 8. UPCOMING EVENTS
  // NO INVENTED DATES OR VENUES: Clearly marked placeholders
  events: [
    {
      id: "event-1",
      category: "LOCAL",
      title: "[Annual Church Conference / Special Program — To Be Supplied]",
      date: "[Event Date — To Be Supplied]",
      time: "[Time — To Be Supplied]",
      location: "[Church Auditorium / Online — To Be Supplied]",
      description: "A transformative gathering of the saints under the ministry of God's Word with Pastor Joseph Atibi-Brown.",
      image: "assets/images/image_17.jpg",
      status: "Upcoming"
    },
    {
      id: "event-2",
      category: "LOCAL",
      title: "[Sunday Celebration Service — To Be Supplied]",
      date: "[Upcoming Sunday — To Be Supplied]",
      time: "[Service Time — To Be Supplied]",
      location: "[Church Auditorium — To Be Supplied]",
      description: "Experience divine worship, biblical illumination, and loving fellowship with the New Benin church family.",
      image: "assets/images/image_13.jpg",
      status: "Weekly"
    },
    {
      id: "event-3",
      category: "CHRIST EMBASSY GLOBAL",
      title: "[Global Day of Prayer / Ministry Program with Pastor Chris — To Be Supplied]",
      date: "[Global Event Date — To Be Supplied]",
      time: "[Global Broadcast Time — To Be Supplied]",
      location: "Worldwide Broadcast (Live from Christ Embassy Global)",
      description: "Participate with millions of saints worldwide in global prayer and ministry under the leadership of Rev. Dr. Chris Oyakhilome.",
      image: "assets/images/image_15.jpg",
      status: "Global Event"
    }
  ],

  // 9. STORIES & TESTIMONIES (Inspired by cebeninzone1.org format)
  stories: {
    sectionHeading: "Stories & Testimonies",
    sectionSubheading: "Celebrating what God is doing in the lives of our church family.",
    featured: {
      id: "story-miraculous-transformation",
      category: "LOCAL",
      eyebrow: "Member Testimony",
      quote: "“Through the teaching of God's Word at Christ Embassy New Benin, my life, career, and family were completely turned around.”",
      author: "[Church Member Testimony — Details To Be Supplied]",
      description: "Hearing God's Word taught with simplicity and power under Pastor Joseph Atibi-Brown brought clarity of purpose and divine restoration.",
      image: "assets/images/image_08.jpg",
      fullStory: "When I first stepped into Christ Embassy New Benin, I was seeking direction. The Word of God shared from the pulpit demystified faith and gave me unshakeable boldness. God's grace has elevated every aspect of my journey since."
    },
    items: [
      {
        id: "story-healing-breakthrough",
        category: "LOCAL",
        title: "[Supernatural Healing & Grace — Details To Be Supplied]",
        author: "[Church Member — Details To Be Supplied]",
        excerpt: "Testimony of physical restoration and divine health through faith in God's promises.",
        image: "assets/images/image_09.jpg"
      },
      {
        id: "story-youth-empowerment",
        category: "LOCAL",
        title: "[Academic & Professional Triumph — Details To Be Supplied]",
        author: "[Youth Ministry Member — Details To Be Supplied]",
        excerpt: "How Foundation School and teenage mentorship ignited a passion for leadership and excellence.",
        image: "assets/images/image_12.jpg"
      },
      {
        id: "story-family-salvation",
        category: "LOCAL",
        title: "[Household Salvation & Community Outreach — Details To Be Supplied]",
        author: "[Cell Leader — Details To Be Supplied]",
        excerpt: "An outreach testimony demonstrating how a neighborhood was touched by the Gospel.",
        image: "assets/images/image_16.jpg"
      }
    ]
  },

  // 10. LATEST SERMONS & MESSAGES
  // Configurable YouTube IDs and authentic minister details
  sermons: [
    {
      id: "sermon-1",
      speaker: "Pastor Joseph Atibi-Brown",
      speakerRole: "Pastor, Christ Embassy New Benin",
      title: "[Message Title: Walking in Divine Dominion — To Be Supplied]",
      scripture: "[Scripture Reference: Romans 8:37 — To Be Supplied]",
      date: "[Message Date — To Be Supplied]",
      duration: "[Duration — e.g. 52 mins]",
      thumbnail: "assets/images/image_03.jpg",
      youtubeId: "", // Church admin can insert YouTube video ID (e.g. "dQw4w9WgXcQ")
      description: "An inspiring exploration of the believer's inheritance and authority in Christ Jesus, delivered at Christ Embassy New Benin."
    },
    {
      id: "sermon-2",
      speaker: "Pastor Joseph Atibi-Brown",
      speakerRole: "Pastor, Christ Embassy New Benin",
      title: "[Message Title: The Power of Persistent Faith — To Be Supplied]",
      scripture: "[Scripture Reference: Hebrews 11:1-6 — To Be Supplied]",
      date: "[Message Date — To Be Supplied]",
      duration: "[Duration — e.g. 48 mins]",
      thumbnail: "assets/images/image_05.jpg",
      youtubeId: "",
      description: "Discover how living by faith produces supernatural results in every facet of personal and professional life."
    },
    {
      id: "sermon-3",
      speaker: "Pastor Joseph Atibi-Brown",
      speakerRole: "Pastor, Christ Embassy New Benin",
      title: "[Message Title: Living a Life of Purpose & Excellence — To Be Supplied]",
      scripture: "[Scripture Reference: Colossians 3:23-24 — To Be Supplied]",
      date: "[Message Date — To Be Supplied]",
      duration: "[Duration — e.g. 55 mins]",
      thumbnail: "assets/images/image_07.jpg",
      youtubeId: "",
      description: "Unpacking what it means to be the 'Church of Excellence' and demonstrating the character of the Spirit in daily living."
    }
  ],

  // 11. WATCH LIVE & STREAMING CONFIGURATION
  live: {
    heading: "Join Us Live",
    subtitle: "Connect with Christ Embassy New Benin wherever you are. Join our live services and experience the Word, worship and fellowship with us.",
    isLiveNow: false, // Set to true when a service broadcast is active
    statusText: "[Live Stream URL — To Be Supplied]",
    configuredLiveUrl: "", // Insert actual YouTube Live, Facebook Live, or custom HLS URL
    youtubeLiveChannelUrl: "[YouTube Channel URL — To Be Supplied]",
    offlineMessage: "Live stream is currently offline. Check our weekly service schedule or watch our recent messages on demand.",
    hudOptions: {
      enablePrayerRequest: true,
      enableSermonNotes: true,
      enableFastGiving: true
    }
  },

  // 12. PLAN YOUR VISIT (First-Time Visitor Guide)
  visit: {
    heading: "Plan Your Visit",
    welcomeNote: "We are thrilled to welcome you! Whether you are visiting Benin City or looking for a home church where God's Word is lived in excellence, our doors and hearts are open wide.",
    address: "[Church Address — To Be Supplied]",
    serviceTimesSummary: "[Sunday & Wednesday Service Times — To Be Supplied]",
    parkingInfo: "[Parking & Arrival Instructions — To Be Supplied by Church Office]",
    whatToExpect: [
      { title: "Warm Welcome", desc: "A gracious hospitality team ready to guide you and answer any questions." },
      { title: "Inspiring Worship", desc: "Vibrant, spirit-led praise and heartfelt worship that honors God." },
      { title: "Empowering Word", desc: "Practical, revelatory biblical teaching that equips you for everyday victory." },
      { title: "Children’s Church", desc: "Safe, engaging, and faith-filled classrooms for your children." }
    ],
    googleMapsEmbedUrl: "" // Insert real Google Maps embed link when address is verified
  },

  // 13. GIVING / PARTNER WITH US
  // All financial categories and URLs are configurable; no fake bank data
  giving: {
    heading: "Partner With Us",
    subtitle: "Your generosity helps us advance the Gospel, support people, strengthen our community, and fulfill God's purpose through the ministry.",
    scriptureQuote: "“Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over.” — Luke 6:38",
    categories: [
      { id: "tithe", name: "Tithe", desc: "Honoring God with the tenth of our increase" },
      { id: "offering", name: "General Offering", desc: "Freewill offerings supporting regular church ministry" },
      { id: "partnership", name: "Partnership", desc: "Partnering directly with local soul-winning and ministry initiatives" },
      { id: "building", name: "Building Fund", desc: "Expansion and maintenance of church facilities" },
      { id: "firstfruits", name: "First Fruits", desc: "Special consecrated dedication of first earnings" }
    ],
    presetAmounts: [25, 50, 100, 250],
    frequencies: ["One-Time", "Weekly", "Monthly"],
    onlineGivingUrl: "[Online Giving URL — To Be Supplied]",
    bankDetails: {
      bankName: "[Bank Name — To Be Supplied]",
      accountName: "[Account Name: Christ Embassy New Benin — To Be Supplied]",
      accountNumber: "[Account Number — To Be Supplied]",
      swiftCode: "[Swift/Routing Code — If Applicable]"
    }
  },

  // 14. CHRIST EMBASSY GLOBAL RESOURCES & FEATURED
  featuredContent: [
    {
      id: "feat-rhapsody",
      category: "CHRIST EMBASSY GLOBAL",
      title: "Rhapsody of Realities Daily Devotional",
      desc: "The world's number one daily devotional, written by Rev. Dr. Chris Oyakhilome, distributing divine revelation across the globe.",
      linkText: "Explore Rhapsody",
      linkUrl: "https://rhapsodyofrealities.org/",
      badge: "Global Resource"
    },
    {
      id: "feat-healing-streams",
      category: "CHRIST EMBASSY GLOBAL",
      title: "Healing Streams Live Healing Services",
      desc: "Worldwide online healing crusades manifesting the miraculous power of God in homes and hospitals globally.",
      linkText: "Watch Healing Streams",
      linkUrl: "https://healingstreams.tv/",
      badge: "Global Impact"
    },
    {
      id: "feat-local-foundation",
      category: "LOCAL",
      title: "Foundation School Graduation & Enrollment",
      desc: "Take your walk with the Lord to the next level. Sign up for our upcoming Foundation School class sessions.",
      linkText: "Join Next Cohort",
      linkUrl: "#ministries",
      badge: "Local Church Notice"
    }
  ],

  // 15. CONTACT INFORMATION & OFFICE HOURS
  contact: {
    heading: "Get In Touch",
    subtitle: "We would love to hear from you. Reach out to our pastoral office or visit us in person.",
    address: "[Church Address — To Be Supplied]",
    phone: "[Phone Number — To Be Supplied]",
    email: "[Email Address — To Be Supplied]",
    officeHours: "[Church Office Hours — To Be Supplied]",
    formRecipientNotice: "Messages submitted will be received by the Christ Embassy New Benin church administration."
  },

  // 16. SOCIAL MEDIA LINKS (Configurable placeholders)
  socialLinks: [
    { key: "facebook", label: "Facebook", icon: "fa-brands fa-facebook-f", url: "[Facebook Page URL — To Be Supplied]" },
    { key: "instagram", label: "Instagram", icon: "fa-brands fa-instagram", url: "[Instagram URL — To Be Supplied]" },
    { key: "youtube", label: "YouTube", icon: "fa-brands fa-youtube", url: "[YouTube Channel URL — To Be Supplied]" },
    { key: "tiktok", label: "TikTok", icon: "fa-brands fa-tiktok", url: "[TikTok URL — To Be Supplied]" },
    { key: "whatsapp", label: "WhatsApp", icon: "fa-brands fa-whatsapp", url: "[WhatsApp Community URL — To Be Supplied]" }
  ],

  // 17. FOOTER
  footer: {
    affiliationNotice: "A Local Church of the Christ Embassy Ministry",
    leadershipNotice: "Pastored by Pastor Joseph Atibi-Brown | Global Ministry Led by Rev. Dr. Chris Oyakhilome",
    copyrightYear: 2026,
    copyrightText: "© 2026 Christ Embassy New Benin. All rights reserved."
  }
};

// Freeze configuration in production to prevent unintended runtime mutation
if (typeof Object.freeze === "function") {
  Object.freeze(CEC_CONFIG);
}
