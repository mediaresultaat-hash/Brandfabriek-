import "./globals.css";

export const metadata = {
  title: "Brandfabriek Social Planner",
  description: "Plan, review, and approve social content with clients."
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
