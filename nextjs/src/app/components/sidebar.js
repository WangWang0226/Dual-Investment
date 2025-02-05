
export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <div className="sidebar" data-aos="fade-right">
      <ul>
        <li
          onClick={() => setCurrentPage("explanation")}
          className={currentPage === "explanation" ? "active" : ""}
        >
          How to Play
        </li>
        <li
          onClick={() => setCurrentPage("playground")}
          className={currentPage === "playground" ? "active" : ""}
        >
          Invest
        </li>
        <li
          onClick={() => setCurrentPage("user-positions")}
          className={currentPage === "user-positions" ? "active" : ""}
        >
          Your Positions
        </li>
        <li
          onClick={() => setCurrentPage("about-this-project")}
          className={currentPage === "about-this-project" ? "active" : ""}
        >
          About This Project
        </li>
      </ul>
    </div>
  );
}

