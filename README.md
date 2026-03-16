# SlayFit – AI Fashion Outfit Generator 👗✨

SlayFit is an **AI-powered fashion assistant** that helps users manage their wardrobe and generate stylish outfit combinations using artificial intelligence.

Users can upload clothing items, organize their wardrobe, and receive **smart outfit recommendations** based on their collection.

---

## 🚀 Features

* 👕 Upload and manage wardrobe items
* 🤖 AI-powered outfit generation
* 📸 Image analysis for clothing items
* 🔐 User authentication
* 💾 Save favorite outfits
* 🧠 Smart recommendations based on wardrobe data

---

## 🛠 Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* ShadCN UI

**Backend / Services**

* Supabase (Database + Authentication)
* Serverless Functions

**AI Integration**

* Gemini API for clothing analysis
* AI outfit generation logic

---

## 📂 Project Structure

```
slay-fit-fashion
│
├── src
│   ├── components
│   ├── pages
│   ├── contexts
│   ├── hooks
│   ├── utils
│   └── integrations
│
├── supabase
│   ├── functions
│   └── migrations
│
├── public
├── api
└── package.json
```

---

## ⚙️ Installation

Clone the repository:

```
git clone https://github.com/deepikakonderu/slay-fit-fashion.git
```

Go to the project folder:

```
cd slay-fit-fashion
```

Install dependencies:

```
npm install
```

Run the development server:

```
npm run dev
```

The app will start at:

```
http://localhost:5173
```

---

## 🔑 Environment Variables

Create a `.env` file in the root folder and add:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
GEMINI_API_KEY=your_gemini_api_key
```

⚠️ Never commit `.env` files to GitHub.

---

## 🌐 Deployment

This project can be easily deployed using **Vercel**.

Steps:

1. Push the project to GitHub
2. Go to Vercel
3. Import the repository
4. Add environment variables
5. Deploy

---



## 🎯 Future Improvements

* Weather-based outfit recommendations
* Style preference learning
* Outfit rating system
* Mobile responsive enhancements
* Social sharing of outfits

---

## 👩‍💻 Author

**Deepika Konderu**

GitHub:
https://github.com/deepikakonderu

---

## 📜 License

This project is licensed under the MIT License.
