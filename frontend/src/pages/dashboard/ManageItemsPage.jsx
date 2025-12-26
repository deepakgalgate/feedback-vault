import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { businessItemAPI, categoryAPI, itemAPI, variantAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Package, 
  ArrowLeft,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RatingDisplay } from '@/components/common/StarRating';
import { toast } from 'sonner';

const ManageItemsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isBusinessOwner } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedItem, setExpandedItem] = useState(null);
  const [itemVariants, setItemVariants] = useState({});
  
  // Modal states
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentVariant, setCurrentVariant] = useState(null);
  
  // Form states
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category_id: '',
    image_url: '',
    price_range: '',
    tags: ''
  });
  const [variantForm, setVariantForm] = useState({
    name: '',
    attributes: '',
    price: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/dashboard/items');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        businessItemAPI.getItems().catch(() => ({ data: [] })),
        categoryAPI.getAll()
      ]);
      setItems(itemsRes.data);
      setCategories(catsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async (itemId) => {
    try {
      const response = await businessItemAPI.getVariants(itemId);
      setItemVariants(prev => ({ ...prev, [itemId]: response.data }));
    } catch (error) {
      console.error('Failed to load variants:', error);
    }
  };

  const toggleItemExpand = (itemId) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
      if (!itemVariants[itemId]) {
        loadVariants(itemId);
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...itemForm,
        tags: itemForm.tags ? itemForm.tags.split(',').map(t => t.trim().toLowerCase()) : [],
        business_id: user.business_id
      };
      await itemAPI.create(data);
      toast.success('Item added successfully!');
      setShowAddItem(false);
      resetItemForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add item');
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!currentItem) return;
    try {
      const data = {
        name: itemForm.name || undefined,
        description: itemForm.description || undefined,
        image_url: itemForm.image_url || undefined,
        price_range: itemForm.price_range || undefined,
        tags: itemForm.tags ? itemForm.tags.split(',').map(t => t.trim().toLowerCase()) : undefined
      };
      await businessItemAPI.updateItem(currentItem.id, data);
      toast.success('Item updated successfully!');
      setShowEditItem(false);
      resetItemForm();
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure? This will delete all variants and reviews for this item.')) return;
    try {
      await businessItemAPI.deleteItem(itemId);
      toast.success('Item deleted successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete item');
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!currentItem) return;
    try {
      let attributes = {};
      if (variantForm.attributes) {
        variantForm.attributes.split(',').forEach(attr => {
          const [key, value] = attr.split(':').map(s => s.trim());
          if (key && value) attributes[key] = value;
        });
      }
      const data = {
        name: variantForm.name,
        item_id: currentItem.id,
        attributes,
        price: variantForm.price ? parseFloat(variantForm.price) : null
      };
      await variantAPI.create(data);
      toast.success('Variant added successfully!');
      setShowAddVariant(false);
      resetVariantForm();
      loadVariants(currentItem.id);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId, itemId) => {
    if (!confirm('Are you sure? This will delete all reviews for this variant.')) return;
    try {
      await businessItemAPI.deleteVariant(variantId);
      toast.success('Variant deleted successfully');
      loadVariants(itemId);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete variant');
    }
  };

  const resetItemForm = () => {
    setItemForm({ name: '', description: '', category_id: '', image_url: '', price_range: '', tags: '' });
    setCurrentItem(null);
  };

  const resetVariantForm = () => {
    setVariantForm({ name: '', attributes: '', price: '' });
    setCurrentVariant(null);
  };

  const openEditItem = (item) => {
    setCurrentItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      category_id: item.category_id,
      image_url: item.image_url || '',
      price_range: item.price_range || '',
      tags: item.tags?.join(', ') || ''
    });
    setShowEditItem(true);
  };

  const openAddVariant = (item) => {
    setCurrentItem(item);
    resetVariantForm();
    setShowAddVariant(true);
  };

  if (!isAuthenticated || !isBusinessOwner) {
    return (
      <div className="min-h-screen bg-zinc-50 py-16">
        <div className="container-narrow text-center">
          <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Manage Items</h1>
          <p className="text-zinc-500 mb-6">
            Only business owners can manage items.
          </p>
          <Button onClick={() => navigate('/register?type=business')}>
            Create Business Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8" data-testid="manage-items-page">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 
              className="text-3xl font-bold text-zinc-900 tracking-tight"
              style={{ fontFamily: 'Chivo, sans-serif' }}
            >
              Manage Items
            </h1>
            <p className="text-zinc-600 mt-1">{items.length} items in your catalog</p>
          </div>
          <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 mt-4 md:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g., Paneer Tikka Masala"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select 
                    value={itemForm.category_id} 
                    onValueChange={(v) => setItemForm({ ...itemForm, category_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    placeholder="Describe your item..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Price Range</Label>
                    <Input
                      value={itemForm.price_range}
                      onChange={(e) => setItemForm({ ...itemForm, price_range: e.target.value })}
                      placeholder="e.g., $10-15"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={itemForm.image_url}
                      onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={itemForm.tags}
                    onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
                    placeholder="spicy, vegetarian, authentic"
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddItem(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                    Add Item
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-zinc-200 rounded-xl">
            <Package className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-900 mb-2">No items yet</h3>
            <p className="text-zinc-500 mb-6">Add your first item to start collecting feedback</p>
            <Button onClick={() => setShowAddItem(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                {/* Item Row */}
                <div className="p-4 flex items-center gap-4">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-zinc-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-zinc-900 truncate">{item.name}</h3>
                    <div className="flex items-center gap-4 mt-1">
                      <RatingDisplay rating={item.avg_rating || 0} reviewCount={item.review_count || 0} size="sm" />
                      {item.price_range && (
                        <span className="text-sm text-zinc-500">{item.price_range}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditItem(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleItemExpand(item.id)}
                    >
                      {expandedItem === item.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Variants */}
                {expandedItem === item.id && (
                  <div className="border-t border-zinc-100 bg-zinc-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-zinc-700">Variants</h4>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openAddVariant(item)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add Variant
                      </Button>
                    </div>
                    {itemVariants[item.id]?.length > 0 ? (
                      <div className="space-y-2">
                        {itemVariants[item.id].map((variant) => (
                          <div key={variant.id} className="bg-white border border-zinc-200 rounded-lg p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-zinc-900">{variant.name}</p>
                              <div className="flex items-center gap-3 text-sm text-zinc-500">
                                <span>{variant.avg_rating?.toFixed(1) || '0.0'} ★</span>
                                <span>{variant.review_count || 0} reviews</span>
                                {variant.price && <span>${variant.price}</span>}
                              </div>
                              {Object.keys(variant.attributes || {}).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(variant.attributes).map(([k, v]) => (
                                    <span key={k} className="text-xs bg-zinc-100 px-2 py-0.5 rounded">
                                      {k}: {v}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteVariant(variant.id, item.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 text-center py-4">No variants yet</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Item Modal */}
        <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditItem} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price Range</Label>
                  <Input
                    value={itemForm.price_range}
                    onChange={(e) => setItemForm({ ...itemForm, price_range: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={itemForm.tags}
                  onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditItem(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Variant Modal */}
        <Dialog open={showAddVariant} onOpenChange={setShowAddVariant}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Variant to {currentItem?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddVariant} className="space-y-4">
              <div className="space-y-2">
                <Label>Variant Name *</Label>
                <Input
                  value={variantForm.name}
                  onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  placeholder="e.g., Medium Spice, Large Portion"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Attributes (key:value, comma-separated)</Label>
                <Input
                  value={variantForm.attributes}
                  onChange={(e) => setVariantForm({ ...variantForm, attributes: e.target.value })}
                  placeholder="spice:medium, portion:large"
                />
              </div>
              <div className="space-y-2">
                <Label>Price (optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                  placeholder="12.99"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddVariant(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Add Variant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ManageItemsPage;
