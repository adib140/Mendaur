import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen, TrendingUp, Filter } from "lucide-react";
import ArtikelCard from "../../lib/artikel";
import useScrollTop from "../../lib/useScrollTop";
import { API_BASE_URL } from "../../../config/api";
import "./artikelPage.css";

const ArtikelPage = () => {
  useScrollTop();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [popularArticles, setPopularArticles] = useState([]);
  // const [stats, setStats] = useState({ total: 0, categories: 0 });

  useEffect(() => {
    fetchCategories();
    fetchPopularArticles();
    // fetchStats();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/artikel`);
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.status === 'success') {
        // Extract unique categories
        const uniqueCategories = [...new Set(result.data.map(a => a.kategori))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchPopularArticles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/artikel`);
      if (!response.ok) return;
      
      const result = await response.json();
      if (result.status === 'success') {
        // Sort by views and take top 5 (use dilihat field)
        const popular = result.data
          .sort((a, b) => (b.dilihat || 0) - (a.dilihat || 0))
          .slice(0, 5);
        setPopularArticles(popular);
      }
    } catch (error) {
      console.error('Error fetching popular articles:', error);
    }
  };

  // const fetchStats = async () => {
  //   try {
  //     const response = await fetch('http://127.0.0.1:8000/api/artikel');
  //     if (!response.ok) return;
      
  //     const result = await response.json();
  //     if (result.status === 'success') {
  //       const uniqueCategories = [...new Set(result.data.map(a => a.kategori))];
  //       setStats({
  //         total: result.data.length,
  //         categories: uniqueCategories.length
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error fetching stats:', error);
  //   }
  // };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by ArtikelCard component through props
  };

  return (
    <div className="artikelPageWrapper">
      {/* Header Section
      <div className="artikelPageHeader">
        <div className="headerContent">
          <h1 className="pageTitle">
            <BookOpen size={32} />
            Artikel Edukasi
          </h1>
          <p className="pageSubtitle">
            Pelajari lebih lanjut tentang pengelolaan sampah, daur ulang, dan kelestarian lingkungan
          </p>

          {/* Stats
          <div className="artikelStats">
            <div className="statItem">
              <span className="statNumber">{stats.total}</span>
              <span className="statLabel">Total Artikel</span>
            </div>
            <div className="statItem">
              <span className="statNumber">{stats.categories}</span>
              <span className="statLabel">Kategori</span>
            </div>
          </div>
        </div>
      </div> */}

      <div className="artikelPageContent">
        {/* Sidebar */}
        <aside className="artikelSidebar">
          {/* Search */}
          <div className="sidebarSection">
            <h3 className="sidebarTitle">
              <Search size={18} />
              Cari Artikel
            </h3>
            <form onSubmit={handleSearch} className="searchForm">
              <input
                type="text"
                placeholder="Cari artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="searchInput"
              />
              <button type="submit" className="searchButton">
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Categories Filter */}
          <div className="sidebarSection">
            <h3 className="sidebarTitle">
              <Filter size={18} />
              Kategori
            </h3>
            <div className="categoryList">
              <button
                className={`categoryButton ${selectedCategory === "" ? "active" : ""}`}
                onClick={() => setSelectedCategory("")}
              >
                Semua Kategori
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`categoryButton ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Popular Articles */}
          <div className="sidebarSection">
            <h3 className="sidebarTitle">
              <TrendingUp size={18} />
              Artikel Populer
            </h3>
            <div className="popularList">
              {popularArticles.map((article) => (
                <Link
                  key={article.artikel_id}
                  to={`/dashboard/artikel/${article.artikel_id}`}
                  className="popularItem"
                >
                  <span className="popularTitle">{article.judul}</span>
                  <span className="popularViews">{article.dilihat || 0} views</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="artikelMain">
          {selectedCategory && (
            <div className="activeFilter">
              <span>Kategori: <strong>{selectedCategory}</strong></span>
              <button onClick={() => setSelectedCategory("")} className="clearFilter">
                ✕ Clear
              </button>
            </div>
          )}
          
          {searchQuery && (
            <div className="activeFilter">
              <span>Pencarian: <strong>"{searchQuery}"</strong></span>
              <button onClick={() => setSearchQuery("")} className="clearFilter">
                ✕ Clear
              </button>
            </div>
          )}

          <ArtikelCard
            fetchFromAPI={true}
            category={selectedCategory}
            searchQuery={searchQuery}
            perPage={9}
            showPagination={true}
          />
        </main>
      </div>
    </div>
  );
};

export default ArtikelPage;
