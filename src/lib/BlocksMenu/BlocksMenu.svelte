<script>
  import util from "../../resources/util";
  import CreateButton from "./CreateButton.svelte";
  import Blockly from "blockly/core";

  function updateBlocks() {
    blocks = window.blocks;
    window.blocks = blocks;

    //refresh workspace
    try {
      let workspace = window.workspace;
      let xml = Blockly.Xml.workspaceToDom(workspace);
      workspace.clear();
      Blockly.Xml.domToWorkspace(xml, workspace);
      this.refreshToolboxSelection();
    } catch {}
  }

  function createBlock() {
    if (!confirm("Are you sure you want to make a block?")) return;

    let id = util.randomHex(16);
    let block = {
      type: "command",
      fields: [
        {
          type: "label",
          text: "block",
          id: util.randomHex(16),
        },
      ],
    };
    window.blocks[id] = block;

    let workspace = window.workspace;
    /** @type {Blockly.BlockSvg} */
    let defineBlock = workspace.newBlock("blocks_define");
    defineBlock.setDeletable(false);
    defineBlock.blockId_ = id;
    defineBlock.updateShape_();
    defineBlock.initSvg();
    defineBlock.render();

    updateBlocks();
  }

  function editBlock(id) {
    window.modals["editblock"].blockId = id;
    window.modals["editblock"].tempBlock = window.blocks[id];
    window.modals["editblock"].toggle();
  }

  function deleteBlock(id) {
    if (!confirm("Are you sure you want to delete this block?")) return;

    delete window.blocks[id];

    let workspace = window.workspace;
    let block = workspace
      .getAllBlocks()
      .find((b) => b.blockId_ === id && b.type === "blocks_define");
    if (block) block.dispose(false, true);

    updateBlocks();
  }

  setInterval(() => {
    if (!globalThis.window) return;
    blocks = window.blocks;
    window.blocks = blocks;
  }, 1000);

  let blocks = {};
</script>

<div class="main">
  <CreateButton on:click={createBlock} />
  {#each Object.entries(blocks) as [id, block]}
    <div class="block">
      <span class="name">{util.blockToName(block.fields)}</span>
      <div>
        <button class="delete" on:click={() => deleteBlock(id)}>Delete</button>
        <button class="edit" on:click={() => editBlock(id)}>Edit</button>
      </div>
    </div>
  {:else}
    <p>no blocks yet!</p>
  {/each}
</div>

<style>
  .main {
    padding: 16px;
    display: flex;
    width: min(calc(100vw - 32px), 1024px);
    flex-direction: column;
    align-items: center;
    margin: auto;
    gap: 0.5em;
  }

  .block {
    background: #8884;
    width: 100%;
    height: 4em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 0.8em;
    box-sizing: border-box;
    padding: 8px;
  }

  .block div {
    display: flex;
    flex-direction: row;
    gap: 0.5em;
  }

  .block button {
    appearance: none;
    border: none;
    width: 100%;
    font-size: 1rem;
    padding: 0.4rem 1rem;
    border-radius: 0.3em;
    cursor: pointer;
    display: flex;
    justify-content: flex-end;
    font-weight: bold;
  }

  .block button.edit {
    background: #4bf;
  }

  .block button.delete {
    background: #ff4a44;
  }
</style>
