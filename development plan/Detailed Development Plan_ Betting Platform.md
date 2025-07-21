# **Detailed Development Plan: Friendly Betting Platform**

## **Technology Stack**

* **Framework**: Next.js 14 with TypeScript  
* **Database**: PostgreSQL (Supabase free tier)  
* **Authentication**: Clerk (free tier)  
* **Styling**: Tailwind CSS  
* **Hosting**: Vercel (free tier)  
* **ORM**: Prisma (for type safety)

## **Database Schema**

sql  
*\-- Users table (synced with Clerk)*  
CREATE TABLE users (  
  id VARCHAR(255) PRIMARY KEY, *\-- Clerk user ID*  
  email VARCHAR(255) UNIQUE NOT NULL,  
  name VARCHAR(255) NOT NULL,  
  balance DECIMAL(10,2) DEFAULT 0.00,  
  is\_admin BOOLEAN DEFAULT FALSE,  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

*\-- Bets table*  
CREATE TABLE bets (  
  id SERIAL PRIMARY KEY,  
  title VARCHAR(255) NOT NULL,  
  description TEXT,  
  options JSONB NOT NULL, *\-- \[{id: 1, text: "Option 1"}, {id: 2, text: "Option 2"}\]*  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked', 'completed')),  
  commission\_rate DECIMAL(5,2) DEFAULT 1.00, *\-- Percentage (1.00 \= 1%)*  
  total\_pool DECIMAL(10,2) DEFAULT 0.00,  
  commission\_amount DECIMAL(10,2) DEFAULT 0.00,  
  prize\_pool DECIMAL(10,2) DEFAULT 0.00,  
  winning\_option\_id INTEGER,  
  created\_by VARCHAR(255) REFERENCES users(id),  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  completed\_at TIMESTAMP WITH TIME ZONE  
);

*\-- Bet participations*  
CREATE TABLE bet\_participations (  
  id SERIAL PRIMARY KEY,  
  bet\_id INTEGER REFERENCES bets(id) ON DELETE CASCADE,  
  user\_id VARCHAR(255) REFERENCES users(id),  
  option\_id INTEGER NOT NULL,  
  amount DECIMAL(10,2) NOT NULL CHECK (amount \>= 10 AND amount % 10 \= 0),  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  updated\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  
  UNIQUE(bet\_id, user\_id) *\-- One participation per user per bet*  
);

*\-- Payment history for audit trail*  
CREATE TABLE payment\_history (  
  id SERIAL PRIMARY KEY,  
  user\_id VARCHAR(255) REFERENCES users(id),  
  type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit', 'bet\_win', 'bet\_loss', 'admin\_adjustment')),  
  amount DECIMAL(10,2) NOT NULL,  
  description TEXT NOT NULL,  
  reference\_id INTEGER, *\-- bet\_id for bet-related transactions*  
  balance\_before DECIMAL(10,2) NOT NULL,  
  balance\_after DECIMAL(10,2) NOT NULL,  
  created\_by VARCHAR(255), *\-- admin user id for manual adjustments*  
  created\_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  
);

*\-- Indexes for performance*  
CREATE INDEX idx\_bets\_status ON bets(status);  
CREATE INDEX idx\_bets\_created\_at ON bets(created\_at DESC);  
CREATE INDEX idx\_bet\_participations\_bet\_id ON bet\_participations(bet\_id);  
CREATE INDEX idx\_bet\_participations\_user\_id ON bet\_participations(user\_id);  
CREATE INDEX idx\_payment\_history\_user\_id ON payment\_history(user\_id);

CREATE INDEX idx\_payment\_history\_created\_at ON payment\_history(created\_at DESC);

## **Project Structure**

src/  
├── app/  
│   ├── api/  
│   │   ├── webhooks/  
│   │   │   └── clerk/  
│   │   │       └── route.ts  
│   │   ├── bets/  
│   │   │   ├── route.ts  
│   │   │   └── \[id\]/  
│   │   │       ├── route.ts  
│   │   │       └── participate/  
│   │   │           └── route.ts  
│   │   ├── admin/  
│   │   │   ├── users/  
│   │   │   │   └── route.ts  
│   │   │   └── bets/  
│   │   │       └── route.ts  
│   │   └── user/  
│   │       ├── profile/  
│   │       │   └── route.ts  
│   │       └── payment-history/  
│   │           └── route.ts  
│   ├── (auth)/  
│   │   ├── sign-in/  
│   │   │   └── page.tsx  
│   │   └── sign-up/  
│   │       └── page.tsx  
│   ├── (dashboard)/  
│   │   ├── home/  
│   │   │   └── page.tsx  
│   │   ├── bets/  
│   │   │   └── page.tsx  
│   │   ├── payments/  
│   │   │   └── page.tsx  
│   │   └── admin/  
│   │       ├── page.tsx  
│   │       ├── users/  
│   │       │   └── page.tsx  
│   │       └── bets/  
│   │           └── page.tsx  
│   ├── layout.tsx  
│   └── page.tsx  
├── components/  
│   ├── ui/  
│   ├── BetCard.tsx  
│   ├── BetParticipationModal.tsx  
│   ├── PaymentHistoryTable.tsx  
│   ├── AdminUserManager.tsx  
│   ├── AdminBetManager.tsx  
│   └── Navigation.tsx  
├── lib/  
│   ├── db.ts  
│   ├── auth.ts  
│   ├── types.ts  
│   └── utils.ts  
├── hooks/  
│   ├── useBets.ts  
│   ├── usePaymentHistory.ts  
│   └── useUserBalance.ts

└── middleware.ts

## **Phase-by-Phase Development Plan**

### **Phase 1: Project Setup & Database (Days 1-2)**

**Day 1: Initial Setup**

1. Create Next.js project with TypeScript  
2. Set up Supabase database  
3. Configure Prisma ORM  
4. Set up Clerk authentication  
5. Install and configure Tailwind CSS

**Day 2: Database & Auth Integration**

1. Create database schema in Supabase  
2. Set up Prisma schema  
3. Configure Clerk webhooks for user sync  
4. Create basic middleware for auth protection  
5. Set up database connection utilities

**Key Files:**

* `prisma/schema.prisma`  
* `lib/db.ts`  
* `middleware.ts`  
* `app/api/webhooks/clerk/route.ts`

### **Phase 2: User Management & Authentication (Days 3-4)**

**Day 3: User System**

1. Create user sync logic for Clerk webhooks  
2. Implement user profile management  
3. Create balance management utilities  
4. Set up protected routes

**Day 4: Payment History System**

1. Create payment history API endpoints  
2. Implement balance adjustment functions  
3. Create audit trail logging  
4. Build payment history UI component

**Key Files:**

* `app/api/user/profile/route.ts`  
* `app/api/user/payment-history/route.ts`  
* `components/PaymentHistoryTable.tsx`  
* `app/(dashboard)/payments/page.tsx`

### **Phase 3: Core Betting Logic (Days 5-8)**

**Day 5: Bet Creation & Management**

1. Create bet creation API endpoints  
2. Implement bet status management  
3. Create bet listing functionality  
4. Build bet creation form for admin

**Day 6: Bet Participation Logic**

1. Implement bet participation API  
2. Add balance validation checks  
3. Create participation editing functionality  
4. Build bet participation modal

**Day 7: Prize Pool Calculation**

1. Implement real-time pool calculation  
2. Create prize distribution algorithm  
3. Add commission calculation  
4. Build bet completion logic

**Day 8: Bet UI Components**

1. Create bet card component  
2. Build bet details view  
3. Implement participation interface  
4. Add real-time pool display

**Key Files:**

* `app/api/bets/route.ts`  
* `app/api/bets/[id]/route.ts`  
* `app/api/bets/[id]/participate/route.ts`  
* `components/BetCard.tsx`  
* `components/BetParticipationModal.tsx`  
* `app/(dashboard)/bets/page.tsx`

### **Phase 4: Admin Panel (Days 9-11)**

**Day 9: Admin User Management**

1. Create admin-only middleware  
2. Build user search functionality  
3. Implement balance adjustment features  
4. Create admin user management UI

**Day 10: Admin Bet Management**

1. Build bet creation interface  
2. Implement bet status controls  
3. Add commission rate editing  
4. Create bet management dashboard

**Day 11: Admin Dashboard**

1. Create admin overview page  
2. Add user statistics  
3. Implement bet analytics  
4. Build admin navigation

**Key Files:**

* `app/api/admin/users/route.ts`  
* `app/api/admin/bets/route.ts`  
* `components/AdminUserManager.tsx`  
* `components/AdminBetManager.tsx`  
* `app/(dashboard)/admin/page.tsx`

### **Phase 5: Data Consistency & Validation (Days 12-13)**

**Day 12: Backend Validation**

1. Implement database transactions  
2. Add comprehensive input validation  
3. Create balance check mechanisms  
4. Implement race condition prevention

**Day 13: Frontend Validation**

1. Add form validation  
2. Implement error handling  
3. Create loading states  
4. Add optimistic updates

### **Phase 6: Testing & Polish (Days 14-15)**

**Day 14: Testing**

1. Test all API endpoints  
2. Validate data consistency  
3. Test edge cases  
4. Performance optimization

**Day 15: UI/UX Polish**

1. Improve responsive design  
2. Add animations and transitions  
3. Enhance user feedback  
4. Final bug fixes

## **Key API Endpoints**

### **Public/User Endpoints**

typescript  
*// Authentication required*  
GET /api/user/profile \- Get user profile and balance  
GET /api/user/payment\-history \- Get user payment history

*// Bets*  
GET /api/bets \- Get all bets with pagination  
GET /api/bets/\[id\] \- Get specific bet details  
POST /api/bets/\[id\]/participate \- Participate in bet

PUT /api/bets/\[id\]/participate \- Edit participation (before locked)

### **Admin Endpoints**

typescript  
*// User management*  
GET /api/admin/users \- Get all users with search  
POST /api/admin/users/\[id\]/adjust\-balance \- Adjust user balance

*// Bet management*  
POST /api/admin/bets \- Create new bet  
PUT /api/admin/bets/\[id\]/status \- Update bet status  
PUT /api/admin/bets/\[id\]/commission \- Update commission rate

PUT /api/admin/bets/\[id\]/complete \- Complete bet with winner

## **Data Types**

typescript  
*// User types*  
interface User {  
  id: string;  
  email: string;  
  name: string;  
  balance: number;  
  isAdmin: boolean;  
  createdAt: Date;  
  updatedAt: Date;  
}

*// Bet types*  
interface BetOption {  
  id: number;  
  text: string;  
}

interface Bet {  
  id: number;  
  title: string;  
  description: string;  
  options: BetOption\[\];  
  status: 'active' | 'locked' | 'completed';  
  commissionRate: number;  
  totalPool: number;  
  commissionAmount: number;  
  prizePool: number;  
  winningOptionId?: number;  
  createdBy: string;  
  createdAt: Date;  
  updatedAt: Date;  
  completedAt?: Date;  
  participations?: BetParticipation\[\];  
}

interface BetParticipation {  
  id: number;  
  betId: number;  
  userId: string;  
  optionId: number;  
  amount: number;  
  createdAt: Date;  
  updatedAt: Date;  
  user?: User;  
}

*// Payment history*  
interface PaymentHistory {  
  id: number;  
  userId: string;  
  type: 'credit' | 'debit' | 'bet\_win' | 'bet\_loss' | 'admin\_adjustment';  
  amount: number;  
  description: string;  
  referenceId?: number;  
  balanceBefore: number;  
  balanceAfter: number;  
  createdBy?: string;  
  createdAt: Date;

}

## **Prize Distribution Algorithm**

typescript  
async function distributePrizes(betId: number, winningOptionId: number) {  
  return await db.transaction(async (tx) \=\> {  
    *// Get bet and all participations*  
    const bet \= await tx.bet.findUnique({  
      where: { id: betId },  
      include: { participations: true }  
    });

    *// Calculate totals*  
    const totalPool \= bet.participations.reduce((sum, p) \=\> sum \+ p.amount, 0);  
    const commissionAmount \= (totalPool \* bet.commissionRate) / 100;  
    const prizePool \= totalPool \- commissionAmount;

    *// Get winners*  
    const winners \= bet.participations.filter(p \=\> p.optionId \=== winningOptionId);  
    const totalWinnerAmount \= winners.reduce((sum, w) \=\> sum \+ w.amount, 0);

    *// Distribute prizes*  
    for (const winner of winners) {  
      const winRatio \= winner.amount / totalWinnerAmount;  
      const prize \= prizePool \* winRatio;  
        
      *// Update user balance*  
      await tx.user.update({  
        where: { id: winner.userId },  
        data: { balance: { increment: prize } }  
      });

      *// Create payment history entry*  
      await tx.paymentHistory.create({  
        data: {  
          userId: winner.userId,  
          type: 'bet\_win',  
          amount: prize,  
          description: \`Prize from bet: ${bet.title}\`,  
          referenceId: betId,  
          balanceBefore: user.balance,  
          balanceAfter: user.balance \+ prize  
        }  
      });  
    }

    *// Update bet status*  
    await tx.bet.update({  
      where: { id: betId },  
      data: {  
        status: 'completed',  
        winningOptionId,  
        totalPool,  
        commissionAmount,  
        prizePool,  
        completedAt: new Date()  
      }  
    });  
  });

}

## **Balance Validation Logic**

typescript  
async function validateAndUpdateBalance(userId: string, amount: number, type: 'debit' | 'credit') {  
  return await db.transaction(async (tx) \=\> {  
    const user \= await tx.user.findUnique({ where: { id: userId } });  
      
    if (\!user) throw new Error('User not found');  
      
    if (type \=== 'debit' && user.balance \< amount) {  
      throw new Error('Insufficient balance');  
    }  
      
    const newBalance \= type \=== 'debit'   
      ? user.balance \- amount   
      : user.balance \+ amount;  
      
    await tx.user.update({  
      where: { id: userId },  
      data: { balance: newBalance }  
    });  
      
    return { balanceBefore: user.balance, balanceAfter: newBalance };  
  });

}

This detailed plan ensures data consistency through proper database transactions, comprehensive validation, and audit trails while maintaining the simplicity you requested. The Next.js structure allows for easy deployment on Vercel's free tier.

**IDEA OF THE PROJECT**  
I want to create a basic website for friendly betting   
All I want is login for authentication using clerk. A home page (one of 3 pages) which displays a button that takes u to bets page(3rd of the 3). A tabular history of all the bets placed and their details( title, description, selected option, result, \+-amount, updated balance after this bet).  
Another page(2nd of the 3 pages) for payment history and balance it shows the list of payments added(credits+) or received for settlement of dues (credits-) and pending balance \+ or \-.  Allotment of the credits and settlement will be done from admin panel no need to create a payment mechanism.  
3rd page is the bets page that displays bets that are created and a button to participate.  All bets are MCQ bets. Each bet has a title and description. while a user is participating he must be seeing what is the current state of bet (as in the current total of price pool  and distribution of the pool in each option). after the bet is completed the prize pool must be distributed among the winners in the ratio of their investments. Investments are in multiple of 10s.There is also a commission rate 1% of the total prize pool. This page also displays past bets on the platform and their results/information. possible statuses of bets being active/ locked/ completed. 

There should also be an admin panel where all users will be listed. the admin can see, add, subtract the credit balance of any user(this change will be displayed on the payment page for the user as previously mentioned) and a search box to look-up a user. Create bets, change the status of bets to active/ locked(no other person can join but results pending)/ completed(results announced).

The project must look fun and data must be consistent.

Potential concerns and replies

* Bet Participation After Results Are Known: Users might try to participate in bets after the outcome is already determined but before status is changed to "completed". \- this is why there is a locked status this will allow admin to lock participation/editing sometime before outcome is decided.  
* Negative Balance Scenario: What happens if a user's balance goes negative after losing bets? Should there be minimum balance checks? yes add the balance checks while placing bets to the detailed plan. also allow editing in the bets (for both amount and option) before status is locked and check balance before amount editing too.  
* Bet Creator Advantage: Can the bet creator participate in their own bet? This could create conflicts of interest. : Admin panel is a separate panel and the person can create another account and participate but we dont mind this advantaage its okay.  
* Commission Calculation: Should commission be deducted before or after prize distribution? This affects the math significantly. The commission is on the total prize pool that is collected before distribution obviously becoz after the prizes it will be nothing left. Also add an option to edit commission rate in admin panel.  
* Minimum Participation: What's the minimum bet amount? Should there be a minimum number of participants for a bet to be valid? no need for minimum number of people coz i will answered what happens if 1 or 0 people participate in next point. Minimum amount is 10 as bet amounts are in multiple of 10s  
* Orphaned Bets: What happens to bets that expire with no participants or only one participant? if one participant than he is treated as a winnner and if 0 participants then nobody gets anything the bet is listed as completed with 0 prize pool.  
* Data Race Conditions: Multiple users participating simultaneously could cause balance/pool calculation issues. i dont think it will affect balance? pool calculation's slow update is okay but it must show correct number after refreshing the page  
* Admin Audit Trail: Changes made by admin should be trackable for transparency. Yes this is why i said changes in balance will reflect in users payment page. I hope its all clear now Now createa detailed plan document it must include all the database schemas.

