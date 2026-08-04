"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageActions } from "@/hooks/usePages";
import { BlockEditorPanel } from "@/modules/pages/blocks/BlockEditorPanel";
import { BlockListItem } from "@/modules/pages/blocks/BlockListItem";
import { BlockPalette } from "@/modules/pages/blocks/BlockPalette";
import { DEFAULT_CONFIGS } from "@/modules/pages/blocks/defaultConfigs";
import type { BlockDefinition, Page } from "@/types/page";

interface BlockBuilderCanvasProps {
  page: Page;
  blockDefinitions: BlockDefinition[];
}

export function BlockBuilderCanvas({ page, blockDefinitions }: BlockBuilderCanvasProps) {
  const { addBlock, updateBlock, deleteBlock, reorderBlocks } = usePageActions(page.page_type);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(page.blocks[0]?.id ?? null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const definitionById = useMemo(
    () => new Map(blockDefinitions.map((d) => [d.id, d])),
    [blockDefinitions]
  );
  const sortedBlocks = useMemo(() => [...page.blocks].sort((a, b) => a.position - b.position), [page.blocks]);
  const selectedBlock = sortedBlocks.find((b) => b.id === selectedBlockId) ?? null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedBlocks.findIndex((b) => b.id === active.id);
    const newIndex = sortedBlocks.findIndex((b) => b.id === over.id);
    const reordered = arrayMove(sortedBlocks, oldIndex, newIndex);
    reorderBlocks.mutate(reordered.map((b) => b.id));
  }

  function handleAddBlock(blockDefinitionId: string) {
    const definition = definitionById.get(blockDefinitionId);
    const config = definition ? (DEFAULT_CONFIGS[definition.key] ?? {}) : {};
    addBlock.mutate({ block_definition_id: blockDefinitionId, config });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="w-full shrink-0 rounded-lg border bg-white p-3 lg:w-64">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Blocks</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortedBlocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {sortedBlocks.map((block) => (
                <BlockListItem
                  key={block.id}
                  block={block}
                  definition={definitionById.get(block.block_definition_id)}
                  isSelected={block.id === selectedBlockId}
                  onSelect={() => setSelectedBlockId(block.id)}
                  onDelete={() => {
                    deleteBlock.mutate(block.id);
                    if (selectedBlockId === block.id) setSelectedBlockId(null);
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        <Button variant="outline" className="mt-3 w-full" onClick={() => setPaletteOpen(true)}>
          <Plus size={14} />
          Add Block
        </Button>
      </div>

      <div className="min-w-0 flex-1 rounded-lg border bg-white p-4">
        {selectedBlock ? (
          <BlockEditorPanel
            key={selectedBlock.id}
            block={selectedBlock}
            definition={definitionById.get(selectedBlock.block_definition_id)}
            isSaving={updateBlock.isPending}
            onSave={(config) => updateBlock.mutate({ blockId: selectedBlock.id, config })}
          />
        ) : (
          <p className="text-sm text-neutral-500">Select a block to edit it, or add one to get started.</p>
        )}
      </div>

      <BlockPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onSelect={handleAddBlock} />
    </div>
  );
}
