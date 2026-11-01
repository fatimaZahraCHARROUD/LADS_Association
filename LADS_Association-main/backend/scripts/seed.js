"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt = __importStar(require("bcrypt"));
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/LADS';
const localized = (en, fr, ar) => ({ en, fr, ar });
const localizedField = {
    en: { type: String, default: '' },
    fr: { type: String, default: '' },
    ar: { type: String, default: '' },
};
const UserSchema = new mongoose_1.Schema({
    fullName: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    role: [String],
    genre: String,
    profileImage: String,
    phone: String,
    birthday: String,
    ville: String,
    niveau_etude: String,
    specialite_etude: String,
    situation: String,
    departement: [String],
    date_adhesion: String,
    cotisation_payee: Boolean,
}, { timestamps: true, collection: 'users' });
const EventSchema = new mongoose_1.Schema({
    title: { type: localizedField, _id: false },
    description: { type: localizedField, _id: false },
    category: String,
    date: String,
    time: String,
    location: String,
    maxParticipants: Number,
    coverImage: String,
    registerLink: String,
    status: String,
    isPublished: Boolean,
    createdBy: { type: mongoose_1.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'events' });
const ActivitySchema = new mongoose_1.Schema({
    title: { type: localizedField, _id: false },
    description: { type: localizedField, _id: false },
    activityDate: String,
    location: String,
    images: [String],
    categorie: String,
    status: String,
    isPublished: Boolean,
    createdBy: { type: mongoose_1.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'activities' });
const NewsSchema = new mongoose_1.Schema({
    title: { type: localizedField, _id: false },
    content: { type: localizedField, _id: false },
    thumbnail: String,
    tags: [String],
    isPublished: Boolean,
    authorId: { type: mongoose_1.Types.ObjectId, ref: 'User' },
    publishedAt: Date,
}, { timestamps: true, collection: 'news' });
const LadsInfoSchema = new mongoose_1.Schema({
    title: { type: localizedField, _id: false },
    content: { type: localizedField, _id: false },
    updatedBy: { type: mongoose_1.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'ladsinfos' });
const ContactMessageSchema = new mongoose_1.Schema({
    fullName: String,
    email: String,
    phone: String,
    subject: String,
    message: String,
}, { timestamps: true, collection: 'contactmessages' });
const MembershipRequestSchema = new mongoose_1.Schema({
    fullName: String,
    email: String,
    phone: String,
    city: String,
}, { timestamps: true, collection: 'membershiprequests' });
const EventRegistrationSchema = new mongoose_1.Schema({
    eventId: { type: mongoose_1.Types.ObjectId, ref: 'Event' },
    fullName: String,
    email: String,
    phone: String,
    registrationDate: Date,
}, { timestamps: true, collection: 'eventregistrations' });
const FormationSchema = new mongoose_1.Schema({
    title: { type: localizedField, _id: false },
    description: { type: localizedField, _id: false },
    imgUrl: String,
    coverImagePublicId: String,
    date: String,
    heure: String,
    category: String,
    status: String,
    registrationLink: String,
    isPublished: Boolean,
    createdBy: { type: mongoose_1.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'formations' });
const User = mongoose_1.default.model('User', UserSchema);
const Event = mongoose_1.default.model('Event', EventSchema);
const Activity = mongoose_1.default.model('Activity', ActivitySchema);
const News = mongoose_1.default.model('News', NewsSchema);
const LadsInfo = mongoose_1.default.model('LadsInfo', LadsInfoSchema);
const ContactMessage = mongoose_1.default.model('ContactMessage', ContactMessageSchema);
const MembershipRequest = mongoose_1.default.model('MembershipRequest', MembershipRequestSchema);
const EventRegistration = mongoose_1.default.model('EventRegistration', EventRegistrationSchema);
const Formation = mongoose_1.default.model('Formation', FormationSchema);
const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fes', 'Tangier', 'Agadir', 'Oujda', 'Tetouan', 'Kenitra', 'Meknes'];
const specialties = ['Computer Science', 'Mathematics', 'Physics', 'Biology', 'Engineering', 'Economics', 'Literature', 'Medicine'];
const levels = ['Bac+2', 'Bac+3', 'Licence', 'Master', 'Doctorat'];
const departments = ['Education', 'Health', 'Environment', 'Culture', 'Sport', 'Technology', 'Communication'];
const eventCategories = ['Workshop', 'Seminar', 'Conference', 'Training', 'Charity', 'Cultural'];
const activityCategories = ['Outreach', 'Volunteering', 'Fundraising', 'Awareness', 'Education'];
const newsTags = ['announcement', 'event', 'milestone', 'partnership', 'community', 'achievement'];
const firstNames = ['Yassine', 'Fatima', 'Mohamed', 'Aicha', 'Omar', 'Sara', 'Hamza', 'Khadija', 'Ali', 'Nadia', 'Rachid', 'Salma', 'Karim', 'Imane', 'Hassan', 'Leila', 'Youssef', 'Hajar', 'Mehdi', 'Asma', 'Tariq', 'Meryem', 'Said', 'Zineb', 'Anas'];
const lastNames = ['El Idrissi', 'Benjelloun', 'Alaoui', 'Bennani', 'Tazi', 'Chraibi', 'Fassi', 'Sebti', 'Berrada', 'El Khattabi', 'Amrani', 'Lahlou', 'Ouazzani', 'Cherkaoui', 'El Mansouri'];
const pick = (arr, i) => arr[i % arr.length];
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
async function seed() {
    console.log(`Connecting to ${MONGODB_URI}...`);
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('Connected.');
    console.log('Clearing existing collections...');
    await Promise.all([
        User.deleteMany({}),
        Event.deleteMany({}),
        Activity.deleteMany({}),
        News.deleteMany({}),
        LadsInfo.deleteMany({}),
        ContactMessage.deleteMany({}),
        MembershipRequest.deleteMany({}),
        EventRegistration.deleteMany({}),
        Formation.deleteMany({}),
    ]);
    console.log('Seeding users...');
    const hashedAdmin = await bcrypt.hash('admin123', 10);
    const hashedUser = await bcrypt.hash('password123', 10);
    const users = [];
    users.push({
        fullName: 'Admin LADS',
        email: 'admin@lads.org',
        password: hashedAdmin,
        role: ['President'],
        genre: 'Male',
        phone: '+212600000000',
        ville: 'Casablanca',
        niveau_etude: 'Master',
        specialite_etude: 'Management',
        situation: 'Active',
        departement: ['Communication'],
        date_adhesion: '2023-01-15',
        cotisation_payee: true,
    });
    const roles = ['President', 'Manager', 'Responsible', 'Member'];
    for (let i = 0; i < 24; i++) {
        const first = pick(firstNames, i);
        const last = pick(lastNames, i);
        users.push({
            fullName: `${first} ${last}`,
            email: `${first.toLowerCase().replace(/\s/g, '')}.${last.toLowerCase().replace(/\s/g, '')}${i}@lads.org`,
            password: hashedUser,
            role: [pick(roles, i)],
            genre: i % 2 === 0 ? 'Male' : 'Female',
            phone: `+2126${String(10000000 + i).padStart(8, '0')}`,
            birthday: `199${i % 10}-0${(i % 9) + 1}-15`,
            ville: pick(cities, i),
            niveau_etude: pick(levels, i),
            specialite_etude: pick(specialties, i),
            situation: i % 3 === 0 ? 'Student' : i % 3 === 1 ? 'Employed' : 'Active',
            departement: [pick(departments, i), pick(departments, i + 1)],
            date_adhesion: `202${3 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            cotisation_payee: i % 3 !== 0,
        });
    }
    const insertedUsers = await User.insertMany(users);
    console.log(`  ${insertedUsers.length} users inserted`);
    const adminId = insertedUsers[0]._id;
    console.log('Seeding events...');
    const events = [];
    for (let i = 0; i < 25; i++) {
        const cat = pick(eventCategories, i);
        const isPast = i % 3 === 0;
        const year = isPast ? 2024 : 2026;
        events.push({
            title: localized(`${cat} #${i + 1}: Building Community`, `${cat} #${i + 1}: Construire la communauté`, `${cat} #${i + 1}: بناء المجتمع`),
            description: localized(`Join us for our ${cat.toLowerCase()} event dedicated to ${pick(departments, i).toLowerCase()}. A unique opportunity to learn, share and connect with other members.`, `Rejoignez-nous pour notre événement ${cat.toLowerCase()} dédié à ${pick(departments, i).toLowerCase()}.`, `انضم إلينا في فعالية ${cat} مخصصة لـ ${pick(departments, i)}.`),
            category: cat,
            date: `${year}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            time: `${String(9 + (i % 8)).padStart(2, '0')}:00`,
            location: pick(cities, i),
            maxParticipants: 20 + i * 5,
            coverImage: `https://picsum.photos/seed/event${i}/800/400`,
            registerLink: `https://lads.org/events/register/${i + 1}`,
            status: isPast ? 'past' : 'upcoming',
            isPublished: i % 4 !== 0,
            createdBy: adminId,
        });
    }
    const insertedEvents = await Event.insertMany(events);
    console.log(`  ${insertedEvents.length} events inserted`);
    console.log('Seeding activities...');
    const activities = [];
    for (let i = 0; i < 25; i++) {
        const cat = pick(activityCategories, i);
        activities.push({
            title: localized(`Activity ${i + 1}: ${cat} Program`, `Activité ${i + 1}: Programme de ${cat}`, `النشاط ${i + 1}: برنامج ${cat}`),
            description: localized(`Activity description ${i + 1}: a comprehensive ${cat.toLowerCase()} initiative aimed at improving local conditions.`, `Description de l'activité ${i + 1}: une initiative complète de ${cat.toLowerCase()}.`, `وصف النشاط ${i + 1}: مبادرة شاملة لـ ${cat}.`),
            activityDate: `202${4 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            location: pick(cities, i),
            images: [
                `https://picsum.photos/seed/activity${i}a/800/400`,
                `https://picsum.photos/seed/activity${i}b/800/400`,
            ],
            categorie: cat,
            status: i % 2 === 0 ? 'completed' : 'upcoming',
            isPublished: i % 5 !== 0,
            createdBy: adminId,
        });
    }
    const insertedActivities = await Activity.insertMany(activities);
    console.log(`  ${insertedActivities.length} activities inserted`);
    console.log('Seeding news...');
    const news = [];
    for (let i = 0; i < 25; i++) {
        news.push({
            title: localized(`News article ${i + 1}: ${pick(newsTags, i)}`, `Article ${i + 1}: ${pick(newsTags, i)}`, `خبر ${i + 1}: ${pick(newsTags, i)}`),
            content: localized(`Full content of news article ${i + 1}. This article covers recent developments and updates from the LADS Association regarding ${pick(departments, i).toLowerCase()}.`, `Contenu complet de l'article ${i + 1}. Cet article couvre les développements récents.`, `المحتوى الكامل للخبر ${i + 1}. يغطي هذا المقال آخر التطورات.`),
            thumbnail: `https://picsum.photos/seed/news${i}/600/400`,
            tags: [pick(newsTags, i), pick(newsTags, i + 1)],
            isPublished: i % 3 !== 0,
            authorId: adminId,
            publishedAt: new Date(2025, i % 12, (i % 28) + 1),
        });
    }
    const insertedNews = await News.insertMany(news);
    console.log(`  ${insertedNews.length} news inserted`);
    console.log('Seeding lads info pages...');
    const infoTitles = [
        'About Us', 'Our Mission', 'Our Vision', 'History', 'Values', 'Team', 'Partners',
        'Achievements', 'Contact Info', 'Volunteering', 'Membership Info', 'Departments',
        'FAQ', 'Privacy Policy', 'Terms of Use', 'Code of Conduct', 'Annual Report 2024',
        'Annual Report 2023', 'Statutes', 'Internal Regulations', 'Press Kit', 'Logo Usage',
        'Donate', 'Sponsor Us', 'Careers',
    ];
    const infos = infoTitles.map((title, i) => ({
        title: localized(title, title, title),
        content: localized(`Detailed content for "${title}". This page describes the organization's approach to ${title.toLowerCase()}.`, `Contenu détaillé pour "${title}". Cette page décrit l'approche de l'organisation.`, `محتوى مفصل لـ "${title}". تصف هذه الصفحة نهج المنظمة.`),
        updatedBy: adminId,
    }));
    const insertedInfos = await LadsInfo.insertMany(infos);
    console.log(`  ${insertedInfos.length} info pages inserted`);
    console.log('Seeding contact messages...');
    const subjects = ['General inquiry', 'Partnership request', 'Volunteer application', 'Press inquiry', 'Donation question', 'Event question', 'Membership help', 'Bug report', 'Feedback'];
    const messages = [];
    for (let i = 0; i < 25; i++) {
        const first = pick(firstNames, i + 3);
        const last = pick(lastNames, i + 2);
        messages.push({
            fullName: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@example.com`,
            phone: `+2126${String(20000000 + i).padStart(8, '0')}`,
            subject: pick(subjects, i),
            message: `Hello, I would like to know more about your association and how I can ${i % 2 === 0 ? 'contribute' : 'participate'}. Please get back to me at your earliest convenience. (Message #${i + 1})`,
        });
    }
    const insertedMessages = await ContactMessage.insertMany(messages);
    console.log(`  ${insertedMessages.length} contact messages inserted`);
    console.log('Seeding membership requests...');
    const requests = [];
    for (let i = 0; i < 25; i++) {
        const first = pick(firstNames, i + 7);
        const last = pick(lastNames, i + 5);
        requests.push({
            fullName: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}+req${i}@example.com`,
            phone: `+2126${String(30000000 + i).padStart(8, '0')}`,
            city: pick(cities, i),
        });
    }
    const insertedRequests = await MembershipRequest.insertMany(requests);
    console.log(`  ${insertedRequests.length} membership requests inserted`);
    console.log('Seeding event registrations...');
    const registrations = [];
    for (let i = 0; i < 25; i++) {
        const first = pick(firstNames, i + 11);
        const last = pick(lastNames, i + 8);
        const event = pickRandom(insertedEvents);
        registrations.push({
            eventId: event._id,
            fullName: `${first} ${last}`,
            email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}+reg${i}@example.com`,
            phone: `+2126${String(40000000 + i).padStart(8, '0')}`,
            registrationDate: new Date(2025, i % 12, (i % 28) + 1),
        });
    }
    const insertedRegistrations = await EventRegistration.insertMany(registrations);
    console.log(`  ${insertedRegistrations.length} event registrations inserted`);
    console.log('Seeding formations...');
    const formationCategories = ['Technical', 'Soft Skills', 'Leadership', 'Languages', 'Entrepreneurship', 'Design'];
    const formationStatuses = ['upcoming', 'ongoing', 'completed'];
    const formations = [];
    for (let i = 0; i < 25; i++) {
        const cat = pick(formationCategories, i);
        formations.push({
            title: localized(`${cat} Training ${i + 1}`, `Formation ${cat} ${i + 1}`, `تدريب ${cat} ${i + 1}`),
            description: localized(`Hands-on ${cat.toLowerCase()} training session ${i + 1}. Open to all members. Covers fundamentals and practical exercises.`, `Session de formation ${cat.toLowerCase()} pratique ${i + 1}. Ouverte à tous les membres.`, `جلسة تدريبية عملية ${cat} رقم ${i + 1}. مفتوحة لجميع الأعضاء.`),
            imgUrl: `https://picsum.photos/seed/formation${i}/800/400`,
            coverImagePublicId: '',
            date: `202${4 + (i % 3)}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
            heure: `${String(9 + (i % 8)).padStart(2, '0')}:00`,
            category: cat,
            status: pick(formationStatuses, i),
            registrationLink: `https://lads.org/formations/register/${i + 1}`,
            isPublished: i % 4 !== 0,
            createdBy: adminId,
        });
    }
    const insertedFormations = await Formation.insertMany(formations);
    console.log(`  ${insertedFormations.length} formations inserted`);
    console.log('\nSeed complete.');
    console.log('Admin login: admin@lads.org / admin123');
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map