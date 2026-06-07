/**
 * One-off import: pre-populates the SaleTracker table from the xlsx data.
 * - David (46 rows + 3 "deals on hold" rows) — rep id: cmq2mv9ka000004jm9qlieibb
 * - Keven/Xavier (56 rows from the Xavier sheet) — rep id: cmq2n9ww9000004l22xiz5axn
 */

import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

const DAVID_ID = 'cmq2mv9ka000004jm9qlieibb';
const KEVEN_ID = 'cmq2n9ww9000004l22xiz5axn';

type Row = {
  repId: string;
  clientName: string;
  projectTotal: number;
  paymentType: string;
  city: string;
  startDate: string;
  signingStatus: string;
  approvalStatus: string;
  fundedStatus: string;
  amountLeftToPay: number | null;
  notes: string;
  onHold: boolean;
};

// ── David's rows (from "David" sheet) ────────────────────────────────────────
const davidRows: Row[] = [
  { repId: DAVID_ID, clientName: 'Olasunbo Olaniyan', projectTotal: 40000, paymentType: 'Finance', city: 'Milton', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 60,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Jonas Moleka', projectTotal: 75363.35, paymentType: 'Finance and Cash', city: 'Oshawa', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 57,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Joyce Allwood', projectTotal: 11500, paymentType: 'Finance', city: 'Mississauga', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Mila Kapoor', projectTotal: 61585, paymentType: 'Cash', city: 'Brampton', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement', approvalStatus: 'N/A', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Rodney Gopee', projectTotal: 77245.95, paymentType: 'Finance', city: 'Brampton', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 77,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Fatima Zeehra', projectTotal: 124865, paymentType: 'Finance and Cash', city: 'Pickering', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 100,000', fundedStatus: 'PARTIALLY', amountLeftToPay: 2634, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Ayo Bello', projectTotal: 73732.50, paymentType: 'Finance', city: 'Hamilton', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Khwaja Siddiqi', projectTotal: 67000, paymentType: 'Finance and Cash', city: 'Hamilton', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 60,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Pravhakar & Yagnasree', projectTotal: 41700, paymentType: 'Finance and Cash', city: 'Milton', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 45,912', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Ramana & Roopa', projectTotal: 60000, paymentType: 'Finance', city: 'Milton', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 60,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Robina Rehmat', projectTotal: 77970, paymentType: 'Finance', city: 'Brampton', startDate: 'In progress', signingStatus: 'Signed and released', approvalStatus: 'Approved 96,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Prasoon Srivastava', projectTotal: 63280, paymentType: 'Finance and Cash', city: 'Ajax', startDate: 'Finished', signingStatus: 'Signed but not released because of limit', approvalStatus: 'Approved 40,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Micheal Cummings', projectTotal: 56000, paymentType: 'Finance', city: 'Vaughn', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 60,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Zohoruddin Noori (Harry)', projectTotal: 89270, paymentType: 'Cash', city: 'Hamilton', startDate: 'In progress', signingStatus: 'Signed', approvalStatus: 'N/A', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Ragini & Shashikanth Barrenkula', projectTotal: 82490, paymentType: 'Finance', city: 'Milton', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement but not released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Salishah Mohammed', projectTotal: 25203.20, paymentType: 'Finance', city: 'Brampton', startDate: 'Finished', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 40,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Md Manjurl Karim (Serhat)', projectTotal: 84750, paymentType: 'Finance', city: 'London', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Mila Kapoor (extra work)', projectTotal: 2542.50, paymentType: 'Cash', city: 'Brampton', startDate: 'Finished', signingStatus: 'Signed. This is for extra work', approvalStatus: 'N/A', fundedStatus: 'YES', amountLeftToPay: null, notes: 'Extra work', onHold: false },
  { repId: DAVID_ID, clientName: 'Thomas Kuthokathan', projectTotal: 77631, paymentType: 'Finance', city: 'Milton', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement but not released', approvalStatus: 'Approved 89,027', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Esther Kana', projectTotal: 76275, paymentType: 'Finance', city: 'Richmond Hill', startDate: 'In progress', signingStatus: 'Signed both finance and service agreement but not released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Sumeiha Sarwary', projectTotal: 58760, paymentType: 'Finance', city: 'Keswick', startDate: 'Feb', signingStatus: 'Signed both finance and service agreement and released', approvalStatus: 'Approved 60,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Robina Rehmat (extra work)', projectTotal: 3616, paymentType: 'Finance', city: 'Brampton', startDate: 'In progress', signingStatus: 'Extra work', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: 'Extra work', onHold: false },
  { repId: DAVID_ID, clientName: 'Saleem Hashimi (Harry)', projectTotal: 73490, paymentType: 'Cash', city: 'Hamilton', startDate: 'TBD', signingStatus: 'Signed', approvalStatus: 'N/A', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Lalaine Amoma', projectTotal: 73450, paymentType: 'Finance', city: 'North York', startDate: 'Feb', signingStatus: 'Signed both finance and service agreement but not released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Lalaine Amoma (extra)', projectTotal: 16700, paymentType: 'Finance', city: 'North York', startDate: 'Feb', signingStatus: 'Signed both finance and service agreement but not released', approvalStatus: 'Approved 100,000', fundedStatus: 'YES', amountLeftToPay: null, notes: 'Additional scope', onHold: false },
  { repId: DAVID_ID, clientName: 'Patrick Mould', projectTotal: 18984, paymentType: 'Cash', city: 'Brampton', startDate: 'ASAP', signingStatus: 'Signed and paid', approvalStatus: 'N/A', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Prameela Chava & Anil Yaramasu', projectTotal: 60000, paymentType: 'Finance', city: 'Oshawa', startDate: 'April', signingStatus: 'PJ private deal. Just flat fee 1000', approvalStatus: 'Approved 60,000', fundedStatus: 'YES', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Yasir Abdelhameed', projectTotal: 84750, paymentType: 'Cash', city: 'Hamilton', startDate: 'April', signingStatus: 'Signed and paid', approvalStatus: 'N/A', fundedStatus: 'PARTIALLY', amountLeftToPay: 3175.32, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Yasir Abdelhameed (extras)', projectTotal: 2260, paymentType: 'Cash', city: 'Hamilton', startDate: 'April', signingStatus: 'Signed and paid', approvalStatus: 'N/A', fundedStatus: 'PARTIALLY', amountLeftToPay: 113, notes: 'Extras', onHold: false },
  { repId: DAVID_ID, clientName: 'Janet Sarpong & John Wesley', projectTotal: 79100, paymentType: 'Finance', city: 'Hamilton', startDate: 'April', signingStatus: 'Signed', approvalStatus: 'Approved 100,000', fundedStatus: 'PARTIALLY', amountLeftToPay: 3955, notes: 'Finance fee not removed yet', onHold: false },
  { repId: DAVID_ID, clientName: 'Sushil Masih', projectTotal: 84750, paymentType: 'Cash', city: 'Hamilton', startDate: 'April', signingStatus: 'Signed and paid', approvalStatus: 'N/A', fundedStatus: 'PARTIALLY', amountLeftToPay: 3175.32, notes: '', onHold: false },
  // Pipeline / In-progress deals
  { repId: DAVID_ID, clientName: 'Joydeep Dutta', projectTotal: 81360, paymentType: 'Finance', city: 'Brampton', startDate: 'April', signingStatus: 'Playing a funny game — will keep approval and see if he comes back', approvalStatus: 'Approved 100,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'John Arockiaraj', projectTotal: 90400, paymentType: 'Finance and Cash', city: 'Downtown Toronto', startDate: 'March', signingStatus: 'Requested call next week. Trying to secure the remaining 30,400 to finalize deal. Requested till end of April', approvalStatus: 'Approved 60,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Uday Rangeswamy', projectTotal: 62150, paymentType: 'Finance', city: 'Milton', startDate: 'April', signingStatus: 'Wants to proceed in April, did first stage of approval not whole thing', approvalStatus: 'Pre-Approved', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Miguel Lopes', projectTotal: 99440, paymentType: 'Cash', city: 'Hamilton', startDate: 'August', signingStatus: 'Looking to start August', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Steve', projectTotal: 71190, paymentType: 'Finance and Cash', city: 'Angus', startDate: 'May', signingStatus: 'Closing another house — approval may affect closing. Slow burn — call in 3 months', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Zabiba Micheal', projectTotal: 250000, paymentType: 'Finance', city: 'Hamilton', startDate: 'April', signingStatus: 'Potential 200,000 for two approvals', approvalStatus: 'Approved 184,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Robert Jhastan Esmie', projectTotal: 95458, paymentType: 'Finance', city: 'Sudbury', startDate: 'April', signingStatus: 'Finalizations and negotiations', approvalStatus: 'Approved 100,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Dhavalkumar Patel & Amishaben Patel', projectTotal: 79100, paymentType: 'Finance', city: 'Hamilton', startDate: 'April', signingStatus: 'Closing soon', approvalStatus: 'Approved 100,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Saira Ikram', projectTotal: 79100, paymentType: 'Finance and Cash', city: 'Hamilton', startDate: 'April', signingStatus: 'Closing soon', approvalStatus: 'Approved 60,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Brian Moniz', projectTotal: 71500.75, paymentType: 'Cash', city: 'Hamilton', startDate: 'May', signingStatus: 'Looking to start May or June', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Matthew Melo', projectTotal: 79100, paymentType: 'Cash', city: 'Hamilton', startDate: 'June', signingStatus: 'Closing soon', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: DAVID_ID, clientName: 'Teresita Reyes', projectTotal: 62150, paymentType: 'Finance and Cash', city: 'Hamilton', startDate: 'June', signingStatus: 'Closing soon', approvalStatus: 'Approved 60,000', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  // Deals on hold
  { repId: DAVID_ID, clientName: 'Silvia Scott', projectTotal: 79100, paymentType: 'Cash', city: 'Caledon', startDate: 'April', signingStatus: 'Refinancing home — wants to pull cash from property. Declined on financing.', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: true },
  { repId: DAVID_ID, clientName: 'Peter Lau', projectTotal: 133340, paymentType: 'Finance and Cash', city: 'Toronto', startDate: 'May', signingStatus: 'Wants to start in May', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: true },
  { repId: DAVID_ID, clientName: 'Malik', projectTotal: 124300, paymentType: 'Finance and Cash', city: 'Brant', startDate: 'March', signingStatus: 'Good meeting at office. Declined on finance app — wants to get cash. Will discuss next week.', approvalStatus: 'N/A', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: true },
];

// ── Keven's rows (from "Xavier" sheet) ───────────────────────────────────────
const kevenRows: Row[] = [
  { repId: KEVEN_ID, clientName: 'Uzair. C', projectTotal: 0, paymentType: '', city: 'Markham', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: "Didn't make appt — father showed up. Coordinate with father. Approved for financing. Unreachable.", onHold: false },
  { repId: KEVEN_ID, clientName: 'Temor Zafari', projectTotal: 0, paymentType: '', city: 'Cambridge', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Send and have Temor review quote', onHold: false },
  { repId: KEVEN_ID, clientName: 'Mark Scott', projectTotal: 73500, paymentType: 'Finance', city: 'East Gwillimbury', startDate: 'October 3, 2025', signingStatus: '', approvalStatus: 'Approved 60,000', fundedStatus: '', amountLeftToPay: null, notes: 'Started 6 months ago, permit received but wants changes. Wishy-washy. Credit limit increased to 60K Aug 15. Still needs 13K cash.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Ruby Daganoto', projectTotal: 4181, paymentType: 'Cash', city: 'London', startDate: 'July 28', signingStatus: '', approvalStatus: 'Cash', fundedStatus: '', amountLeftToPay: null, notes: 'Two egress windows deal. Deal failed — July 28 deadline not met.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Harpreet Deol', projectTotal: 0, paymentType: '', city: 'Brampton', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Homeowner was selling his house — had open house the day I arrived.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Jimmy Narrine', projectTotal: 0, paymentType: '', city: 'Mississauga', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Only reachable on weekends. Wife inquired about kitchen reno too. Wife not ready to move forward.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Sivarupan', projectTotal: 0, paymentType: 'Finance', city: 'Ajax', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'May have bad credit. Title being moved into his name. Need wife to apply. Unresponsive.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Kay Dee', projectTotal: 0, paymentType: '', city: 'Stoney Creek / Hamilton', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Main floor reno + stairs upgrade. Price shopper — unresponsive.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Mayank Pancholi', projectTotal: 0, paymentType: 'Cash', city: 'Clarington', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Quote $64,500 for his house and $62,000 for neighbour. Went cold — unreachable.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Lava', projectTotal: 0, paymentType: '', city: 'Whitby', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Legal basement. Quote ready. Unable to match contractor\'s price.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Sukh Chahal', projectTotal: 0, paymentType: 'Finance', city: 'Kitchener', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Small legal basement. Not approved solo. Requested daughter\'s info.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Mohammed', projectTotal: 0, paymentType: '', city: 'London', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Lead is now dead.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Joe Ingino', projectTotal: 57000, paymentType: 'Cash', city: 'Oshawa', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'PJ shut down this project.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Gustavo / Edis', projectTotal: 0, paymentType: 'Cash or Finance', city: 'North York', startDate: '', signingStatus: '', approvalStatus: 'Approved 25,000', fundedStatus: '', amountLeftToPay: null, notes: 'Pre-qualified for $25K. Quoted price over budget.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Ben', projectTotal: 71500, paymentType: 'Finance and Cash', city: 'Markham', startDate: '', signingStatus: '', approvalStatus: 'Partially — 40,000', fundedStatus: '', amountLeftToPay: null, notes: 'Approved 40K on FinanceIT, needs 33K cash. Elderly folks have been sick — hard to reach.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Asuncion', projectTotal: 0, paymentType: 'Finance', city: '', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Unable to get approved on FinanceIT. Will discuss options.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Sarwar Kazi', projectTotal: 0, paymentType: 'Cash', city: 'Oshawa', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Denied on FinanceIT for both him and wife. Multiple income properties but credit issues.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Sunday Fash', projectTotal: 0, paymentType: '', city: 'Cambridge', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Rescheduled multiple times. Still appears interested. Following up every other day.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Gurmeet Singh', projectTotal: 0, paymentType: '', city: 'Cambridge', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Small kitchen job. Good deal but 30% surcharge for distance.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Frederick / Rubina Lazaro', projectTotal: 0, paymentType: '', city: 'Ajax', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Kitchen and basement project. Closing on property Sept 22.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Seema (Peterborough)', projectTotal: 0, paymentType: '', city: 'Peterborough', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Non-legal basement. Rental for college kids.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Ru Shah', projectTotal: 0, paymentType: 'Finance', city: 'Brampton', startDate: '', signingStatus: '', approvalStatus: 'Approved', fundedStatus: '', amountLeftToPay: null, notes: 'Legal basement. Quote $58,300. Negotiating.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Zam', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Basement kitchen/WR redesign + bedroom addition.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Minire', projectTotal: 0, paymentType: 'Finance', city: 'North York', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Declined for financing — both her and partner.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Zahida', projectTotal: 0, paymentType: '', city: 'Cambridge', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: KEVEN_ID, clientName: 'Sunday Fash (2)', projectTotal: 0, paymentType: '', city: 'Cambridge', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Finished basement wants it legal. Significant water damage.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Atinuke Oni', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: KEVEN_ID, clientName: 'Hamidul Haque Chisty', projectTotal: 0, paymentType: 'Finance', city: 'Pickering', startDate: '', signingStatus: '', approvalStatus: 'Approved 60,000', fundedStatus: '', amountLeftToPay: null, notes: 'Approved for only 60K. Reviewing quote and should be able to sign.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Audley Lawrence', projectTotal: 72500, paymentType: 'Finance', city: 'Brampton', startDate: 'April 1', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Renewing mortgage. Holding off on approval until completed. Expected 3/15.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Carlos Do Rosario', projectTotal: 0, paymentType: '', city: 'Clarington', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Financing declined. DQ.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Isaac Josef', projectTotal: 0, paymentType: 'Finance', city: 'Simcoe', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'House from 1910 — only 5ft basement height. Wants to rent once renovated.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Waqas / Sadia Qureshi', projectTotal: 67000, paymentType: 'Cash', city: 'Keswick / Georgina', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Deal went to Harry but he was MIA for over a week.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Asif Khan', projectTotal: 50000, paymentType: 'Cash and Finance', city: 'Ajax', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'PJ doesn\'t want the job. May be price matching.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Rubina Akther', projectTotal: 0, paymentType: 'Finance', city: 'Toronto', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Older couple — 600 sq ft basement. Non-permit. Reviewing quote.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Rubina Emmanual', projectTotal: 0, paymentType: 'Finance', city: 'Hamilton', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Financing declined. DQ.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Maryanne Jayashankar', projectTotal: 0, paymentType: '', city: 'Scarborough', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Not financially capable of approval. Will finish quote and try FinanceIt.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Rupert Rowe', projectTotal: 0, paymentType: 'Finance', city: 'Brooklin / Whitby', startDate: '', signingStatus: 'Pending quote', approvalStatus: 'Approved 60,000', fundedStatus: '', amountLeftToPay: null, notes: 'Final quote will exceed approval limit. Will move to non-permit job.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Corgia / Copeland', projectTotal: 28000, paymentType: 'Cash', city: 'Ajax', startDate: '', signingStatus: 'Showroom visit', approvalStatus: 'Cash', fundedStatus: '', amountLeftToPay: null, notes: 'Will finalize after fixtures. Side job: painting main floor + accents.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Muhab', projectTotal: 0, paymentType: '', city: 'Hamilton', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Reschedule appt', onHold: false },
  { repId: KEVEN_ID, clientName: 'Seguna Chandran', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: KEVEN_ID, clientName: 'Maninder (Amrit)', projectTotal: 22000, paymentType: 'Finance', city: 'Brampton', startDate: '', signingStatus: '', approvalStatus: 'Approved', fundedStatus: '', amountLeftToPay: null, notes: 'Kitchen to sell house. Quote $22K+HST. Outside budget.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Adeela Intakhab', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: KEVEN_ID, clientName: 'Anik / Sanjida Tilma', projectTotal: 71755, paymentType: 'Finance', city: 'Scarborough', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Quote sent 03/11. Urgent — reviewing with wife.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Urmila / Gagan (Venky)', projectTotal: 49500, paymentType: 'Finance', city: 'Oshawa', startDate: '', signingStatus: '', approvalStatus: 'Approved 62,000', fundedStatus: '', amountLeftToPay: null, notes: 'Agreed $49,500. Updated amount $53K if concrete walkway. Agreed 60K.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Mahendran Saravanamuthu', projectTotal: 76500, paymentType: 'Finance and Cash', city: 'Oshawa', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Quote sent 03/27. Customer reviewing.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Abdul Nazir Hakimi', projectTotal: 79500, paymentType: '', city: 'Oshawa', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Quote sent 03/28. F/u at house 04/15.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Raj Iruthayarah', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Not willing to spend 50K. Non-legal basement. Wife doesn\'t want to spend again.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Gaya De Zoysa', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: '', onHold: false },
  { repId: KEVEN_ID, clientName: 'Rhea / Jed', projectTotal: 52500, paymentType: '', city: 'Ajax', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Appt 03/26. Quote sent 03/30. F/u 03/31.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Emmanuel Ogunjobi', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: 'Declined', fundedStatus: '', amountLeftToPay: null, notes: 'Both him and wife declined. Behind on property tax. Low chances.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Melody Mooibroek', projectTotal: 145000, paymentType: '', city: 'Hamilton', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Waterproofing, underpinning, boiler system. ~140-150K.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Nadeem Ahmed', projectTotal: 0, paymentType: '', city: '', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Submitted 3 items for grant.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Annie Chow', projectTotal: 0, paymentType: 'Finance', city: '', startDate: '', signingStatus: '', approvalStatus: 'FinanceIT pending', fundedStatus: '', amountLeftToPay: null, notes: 'Huge basement — retirement home. PJ and I to visit.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Samsam Hayow', projectTotal: 0, paymentType: '', city: 'Bolton', startDate: '', signingStatus: '', approvalStatus: 'FinanceIT pending', fundedStatus: '', amountLeftToPay: null, notes: 'Decent sq footage. Good lead but homeowner unrealistic on price.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Sheila Barker', projectTotal: 65000, paymentType: '', city: 'Hamilton', startDate: '', signingStatus: '', approvalStatus: 'FinanceIT pending', fundedStatus: '', amountLeftToPay: null, notes: 'Not working, on disability, has 30K cash. May need underpinning.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Madusudan', projectTotal: 0, paymentType: '', city: 'Hamilton', startDate: '', signingStatus: '', approvalStatus: '', fundedStatus: '', amountLeftToPay: null, notes: 'Only interested if qualifies for ADU incentive. Will not proceed unless 40K approved.', onHold: false },
  { repId: KEVEN_ID, clientName: 'Mary Santhi', projectTotal: 65000, paymentType: '', city: 'Hamilton', startDate: '', signingStatus: '', approvalStatus: 'FinanceIT pending', fundedStatus: '', amountLeftToPay: null, notes: 'Mom and dad cannot work — Visa. Only wants to spend 20K. $65K outside budget.', onHold: false },
];

async function main() {
  // Check if already imported
  const existing = await prisma.saleTracker.count();
  if (existing > 0) {
    console.log(`⚠  Already ${existing} tracker rows in DB. Skipping import to avoid duplicates.`);
    console.log('   Delete all SaleTracker rows first if you want to re-import.');
    return;
  }

  const allRows = [...davidRows, ...kevenRows];
  console.log(`Importing ${davidRows.length} David rows + ${kevenRows.length} Keven rows = ${allRows.length} total...\n`);

  for (let i = 0; i < allRows.length; i++) {
    const r = allRows[i];
    await prisma.saleTracker.create({
      data: {
        repId: r.repId,
        clientName: r.clientName,
        projectTotal: r.projectTotal,
        paymentType: r.paymentType,
        city: r.city,
        startDate: r.startDate,
        signingStatus: r.signingStatus,
        approvalStatus: r.approvalStatus,
        fundedStatus: r.fundedStatus,
        amountLeftToPay: r.amountLeftToPay,
        notes: r.notes,
        onHold: r.onHold,
        sortOrder: i,
      },
    });
    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/${allRows.length} rows created…`);
  }

  console.log('\n── Import complete ──────────────────');
  console.log(`  David : ${davidRows.length} rows (${davidRows.filter(r => r.onHold).length} on hold)`);
  console.log(`  Keven : ${kevenRows.length} rows`);
  console.log(`  Total : ${allRows.length} rows`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
