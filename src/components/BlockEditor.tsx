import React, { useState } from 'react';
import { Plus, GripVertical, Trash2, Type, Image, List, Quote, Hash } from 'lucide-react';

export interface DocumentBlock {
  id: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'image';
  content: string;
  level?: number; // for headings
  listItems?: string[]; // for lists
  imageUrl?: string; // for images
  order: number;
}

interface BlockEditorProps {
  blocks: DocumentBlock[];
  onBlocksChange: (blocks: DocumentBlock[]) => void;
}

function BlockEditor({ blocks, onBlocksChange }: BlockEditorProps) {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const addBlock = (type: DocumentBlock['type'], afterIndex?: number) => {
    const newBlock: DocumentBlock = {
      id: Date.now().toString(),
      type,
      content: '',
      order: afterIndex !== undefined ? afterIndex + 1 : blocks.length,
      ...(type === 'heading' && { level: 2 }),
      ...(type === 'list' && { listItems: [''] }),
    };

    const updatedBlocks = [...blocks];
    if (afterIndex !== undefined) {
      updatedBlocks.splice(afterIndex + 1, 0, newBlock);
      // Update order for subsequent blocks
      updatedBlocks.forEach((block, index) => {
        block.order = index;
      });
    } else {
      updatedBlocks.push(newBlock);
    }

    onBlocksChange(updatedBlocks);
  };

  const updateBlock = (blockId: string, updates: Partial<DocumentBlock>) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    onBlocksChange(updatedBlocks);
  };

  const deleteBlock = (blockId: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== blockId);
    // Update order
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });
    onBlocksChange(updatedBlocks);
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(fromIndex, 1);
    updatedBlocks.splice(toIndex, 0, movedBlock);
    
    // Update order
    updatedBlocks.forEach((block, index) => {
      block.order = index;
    });
    
    onBlocksChange(updatedBlocks);
  };

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedBlock) return;

    const draggedIndex = blocks.findIndex(block => block.id === draggedBlock);
    if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
      moveBlock(draggedIndex, targetIndex);
    }
    setDraggedBlock(null);
  };

  const renderBlock = (block: DocumentBlock, index: number) => {
    return (
      <div
        key={block.id}
        className="group relative border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
        draggable
        onDragStart={(e) => handleDragStart(e, block.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, index)}
      >
        {/* Block Controls */}
        <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
          <button
            className="p-1 text-slate-400 hover:text-slate-600 cursor-grab"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 text-red-400 hover:text-red-600"
            title="Delete block"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Block Content */}
        <div className="ml-8">
          {block.type === 'paragraph' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Write your paragraph here..."
              className="w-full min-h-[100px] p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          )}

          {block.type === 'heading' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={block.level || 2}
                  onChange={(e) => updateBlock(block.id, { level: parseInt(e.target.value) })}
                  className="px-2 py-1 border border-slate-300 rounded text-sm"
                >
                  <option value={1}>H1</option>
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                </select>
                <span className="text-sm text-slate-500">Heading Level</span>
              </div>
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Enter heading text..."
                className={`w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  block.level === 1 ? 'text-2xl font-bold' :
                  block.level === 2 ? 'text-xl font-semibold' :
                  'text-lg font-medium'
                }`}
              />
            </div>
          )}

          {block.type === 'list' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">List Items:</label>
              {(block.listItems || ['']).map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">{itemIndex + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newItems = [...(block.listItems || [''])];
                      newItems[itemIndex] = e.target.value;
                      updateBlock(block.id, { listItems: newItems });
                    }}
                    placeholder="List item..."
                    className="flex-1 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => {
                      const newItems = (block.listItems || ['']).filter((_, i) => i !== itemIndex);
                      updateBlock(block.id, { listItems: newItems.length ? newItems : [''] });
                    }}
                    className="p-1 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newItems = [...(block.listItems || ['']), ''];
                  updateBlock(block.id, { listItems: newItems });
                }}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                + Add item
              </button>
            </div>
          )}

          {block.type === 'quote' && (
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="Enter quote text..."
              className="w-full min-h-[80px] p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none italic"
            />
          )}
        </div>

        {/* Add Block Button */}
        <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => addBlock('paragraph', index)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
              title="Add paragraph"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => addBlock('heading', index)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
              title="Add heading"
            >
              <Hash className="w-4 h-4" />
            </button>
            <button
              onClick={() => addBlock('list', index)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
              title="Add list"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => addBlock('quote', index)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
              title="Add quote"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Block Editor</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addBlock('paragraph')}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Block
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {blocks.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-300 rounded-lg">
            <Type className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No blocks yet. Start by adding your first block.</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => addBlock('paragraph')}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Type className="w-4 h-4" />
                Paragraph
              </button>
              <button
                onClick={() => addBlock('heading')}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
              >
                <Hash className="w-4 h-4" />
                Heading
              </button>
            </div>
          </div>
        ) : (
          blocks.map((block, index) => renderBlock(block, index))
        )}
      </div>
    </div>
  );
}

export default BlockEditor;