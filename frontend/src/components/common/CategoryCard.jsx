import { Tag } from 'lucide-react';

const CategoryCard = ({ category, onSelect }) => (
  <div 
    onClick={() => onSelect(category.id)}
    className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white p-6 rounded-xl shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl group"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold">{category.name}</h3>
      <div className="bg-white bg-opacity-20 p-2 rounded-lg group-hover:bg-opacity-30 transition-all">
        <Tag className="w-6 h-6" />
      </div>
    </div>
    <p className="text-indigo-100 mb-4">{category.description}</p>
    <div className="flex items-center justify-between">
      <span className="text-sm opacity-75">Click to explore</span>
      <div className="transform group-hover:translate-x-2 transition-transform">
        <span className="text-sm font-medium">View Products →</span>
      </div>
    </div>
  </div>
);

export default CategoryCard;
