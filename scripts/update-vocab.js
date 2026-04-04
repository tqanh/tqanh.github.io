import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// TOEIC vocabulary database - organized by business/TOEIC themes
const TOEIC_VOCABULARY = [
  { word: "accomplish", type: "verb", ipa: "/əˈkʌmplɪʃ/", meaning: "to succeed in doing something", example: "We need to accomplish our goals by the deadline." },
  { word: "achievement", type: "noun", ipa: "/əˈtʃiːvmənt/", meaning: "something done successfully", example: "Winning the contract was a great achievement for the team." },
  { word: "agenda", type: "noun", ipa: "/əˈdʒendə/", meaning: "a list of items to be discussed at a meeting", example: "Please send the agenda before the meeting." },
  { word: "allocate", type: "verb", ipa: "/ˈæləkeɪt/", meaning: "to distribute resources for a purpose", example: "We need to allocate more budget to marketing." },
  { word: "announcement", type: "noun", ipa: "/əˈnaʊnsmənt/", meaning: "a formal public statement", example: "The CEO will make an important announcement tomorrow." },
  { word: "applicant", type: "noun", ipa: "/ˈæplɪkənt/", meaning: "a person who applies for something", example: "We received over fifty applicants for the position." },
  { word: "appointment", type: "noun", ipa: "/əˈpɔɪntmənt/", meaning: "an arrangement to meet someone", example: "I have an appointment with the client at 3 PM." },
  { word: "assemble", type: "verb", ipa: "/əˈsembl/", meaning: "to come together or bring together", example: "The team will assemble in the conference room." },
  { word: "assignment", type: "noun", ipa: "/əˈsaɪnmənt/", meaning: "a task given to someone", example: "Your assignment is due by Friday." },
  { word: "attend", type: "verb", ipa: "/əˈtend/", meaning: "to be present at an event", example: "All employees must attend the training session." },
  { word: "benefit", type: "noun", ipa: "/ˈbenɪfɪt/", meaning: "an advantage or profit", example: "Health insurance is a valuable employee benefit." },
  { word: "budget", type: "noun", ipa: "/ˈbʌdʒɪt/", meaning: "an estimate of income and expenditure", example: "We need to stay within the project budget." },
  { word: "candidate", type: "noun", ipa: "/ˈkændɪdeɪt/", meaning: "a person applying for a job", example: "She is the best candidate for this position." },
  { word: "career", type: "noun", ipa: "/kəˈrɪə/", meaning: "an occupation undertaken for a long period", example: "He built a successful career in finance." },
  { word: "certificate", type: "noun", ipa: "/səˈtɪfɪkət/", meaning: "an official document proving something", example: "You need a certificate to operate this machine." },
  { word: "client", type: "noun", ipa: "/ˈklaɪənt/", meaning: "a person or organization using services", example: "We have a new client in the technology sector." },
  { word: "colleague", type: "noun", ipa: "/ˈkɒliːɡ/", meaning: "a person you work with", example: "My colleague helped me finish the report." },
  { word: "commerce", type: "noun", ipa: "/ˈkɒmɜːs/", meaning: "the activity of buying and selling", example: "E-commerce has transformed retail business." },
  { word: "commission", type: "noun", ipa: "/kəˈmɪʃn/", meaning: "a payment for selling something", example: "Sales representatives earn a 10% commission." },
  { word: "committee", type: "noun", ipa: "/kəˈmɪti/", meaning: "a group of people appointed for a function", example: "The committee will review all proposals." },
  { word: "compensate", type: "verb", ipa: "/ˈkɒmpenseɪt/", meaning: "to pay someone for work or loss", example: "The company will compensate you for overtime." },
  { word: "competitor", type: "noun", ipa: "/kəmˈpetɪtə/", meaning: "a person or company in the same market", example: "Our main competitor launched a new product." },
  { word: "complaint", type: "noun", ipa: "/kəmˈpleɪnt/", meaning: "a statement that something is unsatisfactory", example: "We received a complaint about our service." },
  { word: "conference", type: "noun", ipa: "/ˈkɒnfərəns/", meaning: "a formal meeting for discussion", example: "The annual sales conference is next month." },
  { word: "confirm", type: "verb", ipa: "/kənˈfɜːm/", meaning: "to establish the truth or correctness", example: "Please confirm your attendance by email." },
  { word: "contract", type: "noun", ipa: "/ˈkɒntrækt/", meaning: "a written or spoken agreement", example: "We signed a three-year contract with the supplier." },
  { word: "contribute", type: "verb", ipa: "/kənˈtrɪbjuːt/", meaning: "to give in order to help achieve something", example: "Everyone should contribute ideas to the project." },
  { word: "convention", type: "noun", ipa: "/kənˈvenʃn/", meaning: "a large meeting or conference", example: "The industry convention will be held in Chicago." },
  { word: "cooperate", type: "verb", ipa: "/kəʊˈɒpəreɪt/", meaning: "to work together towards a common goal", example: "We need to cooperate with the overseas team." },
  { word: "corporation", type: "noun", ipa: "/ˌkɔːpəˈreɪʃn/", meaning: "a large company or group of companies", example: "The corporation has offices in twenty countries." },
  { word: "deadline", type: "noun", ipa: "/ˈdedlaɪn/", meaning: "the latest time something should be completed", example: "The deadline for submissions is Friday at 5 PM." },
  { word: "delegate", type: "verb", ipa: "/ˈdelɪɡeɪt/", meaning: "to entrust a task to another person", example: "A good manager knows how to delegate work." },
  { word: "delivery", type: "noun", ipa: "/dɪˈlɪvəri/", meaning: "the action of delivering goods", example: "We expect the delivery by tomorrow morning." },
  { word: "department", type: "noun", ipa: "/dɪˈpɑːtmənt/", meaning: "a division of a large organization", example: "She works in the marketing department." },
  { word: "decrease", type: "verb", ipa: "/dɪˈkriːs/", meaning: "to make or become less", example: "Sales decreased by 15% this quarter." },
  { word: "develop", type: "verb", ipa: "/dɪˈveləp/", meaning: "to grow or cause to grow", example: "We need to develop a new marketing strategy." },
  { word: "distribute", type: "verb", ipa: "/dɪˈstrɪbjuːt/", meaning: "to give out to several people", example: "We distribute our products worldwide." },
  { word: "document", type: "noun", ipa: "/ˈdɒkjumənt/", meaning: "a piece of written information", example: "Please sign this document before you leave." },
  { word: "deadline", type: "noun", ipa: "/ˈdedlaɪn/", meaning: "the latest time or date by which something should be completed", example: "The deadline for this project is next Friday." },
  { word: "efficient", type: "adjective", ipa: "/ɪˈfɪʃnt/", meaning: "achieving maximum productivity", example: "Our new system is much more efficient." },
  { word: "employee", type: "noun", ipa: "/ɪmˈplɔɪiː/", meaning: "a person employed for wages", example: "The company has over 500 employees worldwide." },
  { word: "employer", type: "noun", ipa: "/ɪmˈplɔɪə/", meaning: "a person or organization that employs people", example: "The employer offers excellent benefits." },
  { word: "estimate", type: "noun", ipa: "/ˈestɪmeɪt/", meaning: "an approximate calculation", example: "Can you give me an estimate of the costs?" },
  { word: "expand", type: "verb", ipa: "/ɪkˈspænd/", meaning: "to become or make larger", example: "The company plans to expand into Asian markets." },
  { word: "expense", type: "noun", ipa: "/ɪkˈspens/", meaning: "the cost incurred", example: "Travel expenses will be reimbursed." },
  { word: "experience", type: "noun", ipa: "/ɪkˈspɪəriəns/", meaning: "practical contact with something", example: "She has five years of experience in sales." },
  { word: "export", type: "verb", ipa: "/ɪkˈspɔːt/", meaning: "to send goods to another country", example: "We export our products to over 30 countries." },
  { word: "facility", type: "noun", ipa: "/fəˈsɪləti/", meaning: "a place or equipment for a specific purpose", example: "The new production facility will open next month." },
  { word: "fee", type: "noun", ipa: "/fiː/", meaning: "a payment for professional services", example: "There is a small fee for processing the application." },
  { word: "figure", type: "noun", ipa: "/ˈfɪɡə/", meaning: "a number or statistical item", example: "The sales figures exceeded our expectations." },
  { word: "finance", type: "noun", ipa: "/ˈfaɪnæns/", meaning: "the management of money", example: "She works in the finance department." },
  { word: "forecast", type: "noun", ipa: "/ˈfɔːkɑːst/", meaning: "a prediction of future events", example: "The economic forecast looks positive." },
  { word: "franchise", type: "noun", ipa: "/ˈfræntʃaɪz/", meaning: "authorization to sell a company's goods", example: "They opened a franchise of the popular restaurant chain." },
  { word: "fund", type: "noun", ipa: "/fʌnd/", meaning: "a sum of money saved for a purpose", example: "The project is supported by government funds." },
  { word: "headquarters", type: "noun", ipa: "/ˌhedˈkwɔːtəz/", meaning: "the main office of an organization", example: "Our headquarters are located in New York." },
  { word: "hire", type: "verb", ipa: "/ˈhaɪə/", meaning: "to employ someone", example: "We plan to hire ten new staff members." },
  { word: "income", type: "noun", ipa: "/ˈɪnkʌm/", meaning: "money received for work or investment", example: "Rental income is a stable source of revenue." },
  { word: "increase", type: "verb", ipa: "/ɪnˈkriːs/", meaning: "to become or make greater", example: "Prices increased by 5% this year." },
  { word: "industry", type: "noun", ipa: "/ˈɪndəstri/", meaning: "economic activity concerned with manufacturing", example: "The tourism industry is growing rapidly." },
  { word: "insurance", type: "noun", ipa: "/ɪnˈʃʊərəns/", meaning: "arrangement for compensation of loss", example: "All employees receive health insurance." },
  { word: "invoice", type: "noun", ipa: "/ˈɪnvɔɪs/", meaning: "a list of goods sent with payment details", example: "Please send me an invoice for the services." },
  { word: "labor", type: "noun", ipa: "/ˈleɪbə/", meaning: "work, especially hard physical work", example: "Labor costs have risen significantly." },
  { word: "lease", type: "noun", ipa: "/liːs/", meaning: "a contract for using property", example: "We signed a five-year lease for the office." },
  { word: "liability", type: "noun", ipa: "/ˌlaɪəˈbɪləti/", meaning: "a legal responsibility", example: "The company has limited liability protection." },
  { word: "loan", type: "noun", ipa: "/ləʊn/", meaning: "a sum of money borrowed", example: "We got a loan to start the business." },
  { word: "location", type: "noun", ipa: "/ləʊˈkeɪʃn/", meaning: "a particular place", example: "The new store location is perfect for business." },
  { word: "maintenance", type: "noun", ipa: "/ˈmeɪntənəns/", meaning: "the work needed to keep something in good condition", example: "Regular maintenance is required for the equipment." },
  { word: "manager", type: "noun", ipa: "/ˈmænɪdʒə/", meaning: "a person responsible for controlling an organization", example: "The manager approved our budget request." },
  { word: "manufacture", type: "verb", ipa: "/ˌmænjuˈfæktʃə/", meaning: "to make goods on a large scale", example: "The company manufactures electronic components." },
  { word: "market", type: "noun", ipa: "/ˈmɑːkɪt/", meaning: "a place or situation where buying and selling occurs", example: "We need to understand our target market better." },
  { word: "merchandise", type: "noun", ipa: "/ˈmɜːtʃəndaɪs/", meaning: "goods for sale", example: "The store has a wide selection of merchandise." },
  { word: "merge", type: "verb", ipa: "/mɜːdʒ/", meaning: "to combine or join together", example: "The two companies decided to merge." },
  { word: "negotiate", type: "verb", ipa: "/nɪˈɡəʊʃieɪt/", meaning: "to try to reach an agreement", example: "We need to negotiate better payment terms." },
  { word: "network", type: "noun", ipa: "/ˈnetwɜːk/", meaning: "a group of interconnected people or things", example: "Building a professional network is important." },
  { word: "obligation", type: "noun", ipa: "/ˌɒblɪˈɡeɪʃn/", meaning: "an act to which a person is bound", example: "We have an obligation to deliver on time." },
  { word: "office", type: "noun", ipa: "/ˈɒfɪs/", meaning: "a room for business or professional work", example: "Her office is on the third floor." },
  { word: "operate", type: "verb", ipa: "/ˈɒpəreɪt/", meaning: "to manage the working of", example: "The factory operates 24 hours a day." },
  { word: "order", type: "noun", ipa: "/ˈɔːdə/", meaning: "a request to supply something", example: "We received a large order from overseas." },
  { word: "overtime", type: "noun", ipa: "/ˈəʊvətaɪm/", meaning: "time worked beyond regular hours", example: "Employees are paid extra for overtime work." },
  { word: "payment", type: "noun", ipa: "/ˈpeɪmənt/", meaning: "the action of paying", example: "Payment is due within 30 days." },
  { word: "policy", type: "noun", ipa: "/ˈpɒləsi/", meaning: "a course of action adopted by an organization", example: "The company has a strict no-smoking policy." },
  { word: "position", type: "noun", ipa: "/pəˈzɪʃn/", meaning: "a job or role in an organization", example: "We have an open position in the marketing team." },
  { word: "preference", type: "noun", ipa: "/ˈprefrəns/", meaning: "a greater liking for one alternative", example: "Do you have any preference for meeting times?" },
  { word: "procedure", type: "noun", ipa: "/prəˈsiːdʒə/", meaning: "an established way of doing something", example: "Please follow the standard procedure." },
  { word: "product", type: "noun", ipa: "/ˈprɒdʌkt/", meaning: "an article or substance manufactured", example: "Our new product will launch next month." },
  { word: "profit", type: "noun", ipa: "/ˈprɒfɪt/", meaning: "financial gain", example: "The company reported record profits this year." },
  { word: "promote", type: "verb", ipa: "/prəˈməʊt/", meaning: "to support or actively encourage", example: "We need to promote our products on social media." },
  { word: "proposal", type: "noun", ipa: "/prəˈpəʊzl/", meaning: "a plan or suggestion", example: "The committee reviewed our proposal." },
  { word: "purchase", type: "verb", ipa: "/ˈpɜːtʃəs/", meaning: "to buy something", example: "We need to purchase new office equipment." },
  { word: "qualification", type: "noun", ipa: "/ˌkwɒlɪfɪˈkeɪʃn/", meaning: "a quality that makes someone suitable", example: "The job requires specific qualifications." },
  { word: "quote", type: "noun", ipa: "/kwəʊt/", meaning: "an estimate of the cost", example: "Can you give me a quote for the repairs?" },
  { word: "raise", type: "verb", ipa: "/reɪz/", meaning: "to lift or move to a higher position", example: "We need to raise funds for the project." },
  { word: "receipt", type: "noun", ipa: "/rɪˈsiːt/", meaning: "a written acknowledgment of payment", example: "Please keep your receipt for returns." },
  { word: "recruit", type: "verb", ipa: "/rɪˈkruːt/", meaning: "to enlist someone into an organization", example: "We're actively recruiting new talent." },
  { word: "refund", type: "noun", ipa: "/ˈriːfʌnd/", meaning: "a repayment of money", example: "Customers are entitled to a full refund." },
  { word: "register", type: "verb", ipa: "/ˈredʒɪstə/", meaning: "to enter or record officially", example: "Please register for the conference online." },
  { word: "regulation", type: "noun", ipa: "/ˌreɡjuˈleɪʃn/", meaning: "a rule or directive", example: "New safety regulations have been introduced." },
  { word: "reject", type: "verb", ipa: "/rɪˈdʒekt/", meaning: "to dismiss as inadequate", example: "The committee decided to reject the proposal." },
  { word: "remit", type: "verb", ipa: "/rɪˈmɪt/", meaning: "to send money as payment", example: "Please remit payment by the due date." },
  { word: "remove", type: "verb", ipa: "/rɪˈmuːv/", meaning: "to take away or off", example: "Please remove your shoes before entering." },
  { word: "replace", type: "verb", ipa: "/rɪˈpleɪs/", meaning: "to take the place of", example: "We need to replace the old equipment." },
  { word: "represent", type: "verb", ipa: "/ˌreprɪˈzent/", meaning: "to act on behalf of", example: "She represents our company at trade shows." },
  { word: "request", type: "noun", ipa: "/rɪˈkwest/", meaning: "an act of asking for something", example: "We received a request for more information." },
  { word: "require", type: "verb", ipa: "/rɪˈkwaɪə/", meaning: "to need for a particular purpose", example: "This job requires strong communication skills." },
  { word: "resign", type: "verb", ipa: "/rɪˈzaɪn/", meaning: "to voluntarily leave a job", example: "He decided to resign after ten years." },
  { word: "revenue", type: "noun", ipa: "/ˈrevənjuː/", meaning: "income generated from business", example: "Annual revenue exceeded expectations." },
  { word: "salary", type: "noun", ipa: "/ˈsæləri/", meaning: "a fixed regular payment", example: "The position offers a competitive salary." },
  { word: "schedule", type: "noun", ipa: "/ˈʃedjuːl/", meaning: "a plan for carrying out a process", example: "The project is behind schedule." },
  { word: "shipment", type: "noun", ipa: "/ˈʃɪpmənt/", meaning: "a quantity of goods shipped", example: "The shipment will arrive next Tuesday." },
  { word: "sponsor", type: "noun", ipa: "/ˈspɒnsə/", meaning: "a person or company that supports an event", example: "We are looking for event sponsors." },
  { word: "staff", type: "noun", ipa: "/stɑːf/", meaning: "the employees of an organization", example: "All staff members must attend the meeting." },
  { word: "stock", type: "noun", ipa: "/stɒk/", meaning: "the goods kept on hand", example: "We need to check the inventory stock." },
  { word: "strategy", type: "noun", ipa: "/ˈstrætədʒi/", meaning: "a plan of action", example: "Our marketing strategy needs updating." },
  { word: "submit", type: "verb", ipa: "/səbˈmɪt/", meaning: "to present for consideration", example: "Please submit your report by Friday." },
  { word: "subscribe", type: "verb", ipa: "/səbˈskraɪb/", meaning: "to arrange to receive something regularly", example: "Subscribe to our newsletter for updates." },
  { word: "supplier", type: "noun", ipa: "/səˈplaɪə/", meaning: "a person or company that provides goods", example: "We're switching to a new supplier." },
  { word: "target", type: "noun", ipa: "/ˈtɑːɡɪt/", meaning: "an objective or result aimed at", example: "We exceeded our sales target this quarter." },
  { word: "tenant", type: "noun", ipa: "/ˈtenənt/", meaning: "a person who occupies rented property", example: "The tenant signed a two-year lease." },
  { word: "transaction", type: "noun", ipa: "/trænˈzækʃn/", meaning: "an instance of buying or selling", example: "All transactions are recorded electronically." },
  { word: "transfer", type: "verb", ipa: "/trænsˈfɜː/", meaning: "to move from one place to another", example: "He was transferred to the London office." },
  { word: "union", type: "noun", ipa: "/ˈjuːniən/", meaning: "an organized association of workers", example: "The union negotiated better working conditions." },
  { word: "update", type: "verb", ipa: "/ʌpˈdeɪt/", meaning: "to make more modern or current", example: "Please update me on the project status." },
  { word: "vacancy", type: "noun", ipa: "/ˈveɪkənsi/", meaning: "an unoccupied position or job", example: "We have a vacancy in the IT department." },
  { word: "wage", type: "noun", ipa: "/weɪdʒ/", meaning: "a fixed regular payment for work", example: "The minimum wage has increased this year." },
  { word: "warehouse", type: "noun", ipa: "/ˈweəhaʊs/", meaning: "a large building for storing goods", example: "Products are stored in our central warehouse." },
  { word: "warranty", type: "noun", ipa: "/ˈwɒrənti/", meaning: "a guarantee for repair or replacement", example: "The product comes with a one-year warranty." },
  { word: "withdraw", type: "verb", ipa: "/wɪðˈdrɔː/", meaning: "to remove or take away", example: "You can withdraw money at any ATM." }
];

/**
 * Select 10 random words from the TOEIC vocabulary
 * @returns {Array} Array of 10 vocabulary objects
 */
function selectDailyWords() {
  // Shuffle array using Fisher-Yates algorithm
  const shuffled = [...TOEIC_VOCABULARY];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Return first 10 words
  return shuffled.slice(0, 10);
}

/**
 * Generate the daily vocabulary JSON file
 */
function generateDailyVocab() {
  const dailyWords = selectDailyWords();
  const date = new Date().toISOString().split('T')[0];
  
  const vocabData = {
    date: date,
    count: dailyWords.length,
    words: dailyWords
  };
  
  return vocabData;
}

/**
 * Main function to update vocabulary file
 */
function main() {
  // ES module equivalent of __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  const outputDir = path.join(__dirname, '..', 'src', 'data');
  const outputFile = path.join(outputDir, 'daily-vocab.json');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate and save vocabulary
  const vocabData = generateDailyVocab();
  fs.writeFileSync(outputFile, JSON.stringify(vocabData, null, 2));
  
  console.log(`✓ Generated daily vocabulary for ${vocabData.date}`);
  console.log(`✓ Saved ${vocabData.count} words to ${outputFile}`);
  console.log('\nWords selected:');
  vocabData.words.forEach((word, i) => {
    console.log(`  ${i + 1}. ${word.word} - ${word.meaning}`);
  });
}

// Run if called directly
const isMainModule = import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.includes('update-vocab.js')) {
  main();
}

export { generateDailyVocab, selectDailyWords };
