// scripts/seed.ts

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // .env.local கோப்பிலிருந்து சுற்றுச்சூழல் மாறிகளை ஏற்றவும்

import { embedSubjectGroups } from '../app/lib/tools/getSubjectGroups'; // சப்ஜெக்ட் குழுக்களை உட்பொதிக்கும் செயல்பாடு
import { embedAllStreamDetailedData } from '../app/lib/tools/getSelectsubject'; // இந்த புதிய/மாற்றப்பட்ட செயல்பாட்டை நாம் பயன்படுத்துவோம்

async function main() {
    console.log("\n--- முழு மாடுலர் பைன்கோன் டேட்டா எம்பெடிங் செயல்முறை தொடங்குகிறது ---");
    try {
        // படி 1: முக்கிய சப்ஜெக்ட் குழுக்களை உட்பொதித்தல் (உதாரணமாக, Science with Biology)
        const generatedSubjectGroups = await embedSubjectGroups(); //

        if (generatedSubjectGroups.length > 0) {
            // படி 2: உருவாக்கப்பட்ட ஒவ்வொரு சப்ஜெக்ட் குழுவிற்கும், தொடர்புடைய அனைத்து டேட்டாவையும் உருவாக்கி உட்பொதித்தல்
            console.log("\n--- ஒவ்வொரு கல்வி ஸ்ட்ரீமிற்கும் விரிவான டேட்டாவை உட்பொதித்தல் ---");
            await embedAllStreamDetailedData(generatedSubjectGroups); // Call the function to embed all detailed data
        } else {
            console.warn("எந்த சப்ஜெக்ட் குழுக்களும் உருவாக்கப்படவில்லை. விரிவான டேட்டா உட்பொதித்தல் தவிர்க்கப்படுகிறது.");
        }

        console.log("\n--- முழு மாடுலர் பைன்கோன் டேட்டா எம்பெடிங் செயல்முறை வெற்றிகரமாக முடிந்தது! ---");
    } catch (error) {
        console.error("❌ உட்பொதிக்கும் செயல்முறையின் போது ஒரு பிழை ஏற்பட்டது:", error);
        process.exit(1); // பிழை ஏற்பட்டால் செயல்முறையை நிறுத்து
    }
}

main(); // முக்கிய செயல்பாட்டை இயக்கவும்