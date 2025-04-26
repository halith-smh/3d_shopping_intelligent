import { motion } from "framer-motion";
import { FiShield } from "react-icons/fi";
import { Link } from "react-router-dom"; // for Home navigation
import { BgImage } from "../components";
import { containerVariants, itemVariants, TERMS_CONDITIONS_DATE } from "../utils/constants";
import { FaHome } from "react-icons/fa";

const termsContent = [
    {
        title: "1. Introduction",
        description: `Welcome to <span class="text-primary">AI Enhanced 3D Shopping Intelligent for Retailers</span> ("we", "our", or "us").
      These Terms & Conditions govern your access to and use of our services.`,
    },
    {
        title: "2. Data Collection",
        description: `We collect your name, email, and encrypted password to create and manage your account securely.
      Additionally, we store your interaction history ("chat history") with our AI assistant to improve your personalized shopping experience.`,
    },
    {
        title: "3. Data Usage",
        description: `Your data is used only to deliver relevant responses and enhance your in-store experience.
      We do not train any AI models with your personal data or chat history.`,
    },
    {
        title: "4. Data Storage",
        description: `All collected data is securely stored in our database using MongoDB. Passwords are encrypted, and your chat history is confidentially maintained.`,
    },
    {
        title: "5. User Responsibilities",
        description: `You agree to provide accurate information and maintain the confidentiality of your account credentials.
      You are responsible for all activities under your account.`,
    },
    {
        title: "6. Changes to Terms",
        description: `We reserve the right to update these Terms & Conditions at any time. Continued use of our service after updates indicates your acceptance of the revised terms.`,
    },
    //   {
    //     title: "7. Contact Us",
    //     description: `If you have any questions or concerns about these Terms, please contact us at support@3dshoppingai.com.`,
    //   },
];

const TermsAndConditions = () => {
    return (
        <BgImage>
            <div className="h-screen flex flex-col relative"> {/* Add relative here */}

                {/* Floating Home Icon */}
                <Link
                    to="/"
                    className="fixed top-6 left-6 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-dark transition-colors duration-300 z-50"
                    title="Go Home"
                >
                    <FaHome className="text-xl" />
                </Link>

                {/* Main Content */}
                <div className="flex-1 flex justify-center items-center">
                    <motion.div
                        className="bg-white w-full m-4 p-6 md:w-[700px] rounded-2xl shadow-xl overflow-y-auto"
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        {/* Title Section */}
                        <motion.div variants={itemVariants} className="text-center mb-6">
                            <div className="flex justify-center">
                                <FiShield className="text-primary text-6xl" />
                            </div>
                            <h2 className="text-3xl font-bold text-dark mt-4">Terms & Conditions</h2>
                            <p className="text-light text-sm mt-2">Effective Date: {TERMS_CONDITIONS_DATE}</p>
                        </motion.div>

                        {/* Terms Content */}
                        <motion.div variants={itemVariants} className="text-gray-600 text-sm space-y-6">
                            {termsContent.map((item, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-dark mb-2">{item.title}</h3>
                                    <p dangerouslySetInnerHTML={{ __html: item.description }} />
                                </div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </BgImage>
    );
};


export default TermsAndConditions;
