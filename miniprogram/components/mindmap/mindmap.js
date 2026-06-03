/**
 * @fileoverview Mindmap component using AntV F6 for WeChat Mini Program.
 * Renders family tree data as an interactive mindmap with zoom controls.
 */

const F6 = require('@antv/f6-wx');
const {treeToMindmap} = require('../../utils/mindmap-adapter');

/**
 * Minimum zoom scale allowed.
 * @const {number}
 */
const MIN_ZOOM = 0.3;

/**
 * Maximum zoom scale allowed.
 * @const {number}
 */
const MAX_ZOOM = 2.5;

/**
 * Zoom factor applied on each zoom in/out action.
 * @const {number}
 */
const ZOOM_STEP = 1.2;

/**
 * Default node size in pixels.
 * @const {number}
 */
const NODE_SIZE = 28;

/**
 * Default font size for node labels.
 * @const {number}
 */
const LABEL_FONT_SIZE = 12;

Component({
  properties: {
    /**
     * Tree data to render as mindmap.
     * @type {Object|null}
     */
    treeData: {
      type: Object,
      value: null,
      observer: 'onTreeDataChange',
    },
  },

  data: {
    /**
     * Current zoom scale for display.
     * @type {number}
     */
    scale: 1,
  },

  /**
   * F6 graph instance.
   * @type {Object|null}
   */
  graph: null,

  lifetimes: {
    /**
     * Initializes the F6 graph when component is attached.
     */
    attached() {
      this.initGraph();
    },

    /**
     * Destroys the F6 graph when component is detached.
     */
    detached() {
      if (this.graph) {
        this.graph.destroy();
        this.graph = null;
      }
    },
  },

  methods: {
    /**
     * Initializes the F6 canvas graph.
     * Queries the canvas node and creates the graph instance.
     */
    initGraph() {
      const query = wx.createSelectorQuery().in(this);
      query
        .select('#mindmapCanvas')
        .fields({node: true, size: true})
        .exec((res) => {
          if (!res || !res[0]) {
            console.error('Mindmap canvas not found');
            return;
          }

          const {node: canvasNode, width, height} = res[0];
          if (!canvasNode || !width || !height) {
            console.error('Mindmap canvas size invalid');
            return;
          }

          this.createF6Graph(canvasNode, width, height);
        });
    },

    /**
     * Creates the F6 graph instance with mindmap layout.
     * @param {Object} canvasNode The canvas node from WeChat selector query.
     * @param {number} width Canvas width in pixels.
     * @param {number} height Canvas height in pixels.
     */
    createF6Graph(canvasNode, width, height) {
      const graph = new F6.Graph({
        container: canvasNode,
        context: canvasNode.getContext('2d'),
        renderer: 'canvas',
        width,
        height,
        fitView: true,
        fitViewPadding: [20, 20, 20, 20],
        layout: {
          type: 'mindmap',
          direction: 'H',
          getHeight: () => NODE_SIZE,
          getWidth: () => NODE_SIZE,
          getVGap: () => 20,
          getHGap: () => 60,
        },
        defaultNode: {
          type: 'circle',
          size: NODE_SIZE,
          style: {
            fill: '#ffffff',
            stroke: '#8B4513',
            lineWidth: 2,
          },
          labelCfg: {
            style: {
              fill: '#333333',
              fontSize: LABEL_FONT_SIZE,
              fontWeight: 500,
            },
            position: 'right',
            offset: 8,
          },
        },
        defaultEdge: {
          type: 'cubic-horizontal',
          style: {
            stroke: '#c8c8c8',
            lineWidth: 1.5,
          },
        },
        modes: {
          default: ['drag-canvas', 'zoom-canvas'],
        },
        nodeStateStyles: {
          selected: {
            style: {
              fill: '#f0e6d2',
              stroke: '#8B4513',
              lineWidth: 3,
            },
          },
        },
      });

      this.bindGraphEvents(graph);
      this.graph = graph;

      if (this.properties.treeData) {
        this.renderGraph();
      }
    },

    /**
     * Binds event handlers to the F6 graph.
     * @param {Object} graph The F6 graph instance.
     */
    bindGraphEvents(graph) {
      graph.on('node:tap', (evt) => {
        const {item} = evt;
        const model = item.getModel();
        this.triggerEvent('nodetap', {
          id: model.id,
          label: model.label,
          generation: model.generation,
        });
      });

      graph.on('canvas:tap', () => {
        graph.getNodes().forEach((node) => {
          graph.clearItemStates(node, 'selected');
        });
      });
    },

    /**
     * Handles treeData property changes.
     * Re-renders the graph when new data is provided.
     * @param {Object|null} newData The updated tree data.
     */
    onTreeDataChange(newData) {
      if (!newData || !this.graph) {
        return;
      }
      this.renderGraph();
    },

    /**
     * Renders the graph with current treeData.
     * Transforms data and updates the F6 graph.
     */
    renderGraph() {
      if (!this.graph || !this.properties.treeData) {
        return;
      }

      const mindmapData = treeToMindmap(this.properties.treeData);
      this.graph.data(mindmapData);
      this.graph.render();
      this.graph.fitView();
    },

    /**
     * Zooms in the graph by a fixed step.
     */
    zoomIn() {
      if (!this.graph) {
        return;
      }
      const currentZoom = this.graph.getZoom();
      const newZoom = Math.min(currentZoom * ZOOM_STEP, MAX_ZOOM);
      this.graph.zoomTo(newZoom);
      this.setData({scale: newZoom});
    },

    /**
     * Zooms out the graph by a fixed step.
     */
    zoomOut() {
      if (!this.graph) {
        return;
      }
      const currentZoom = this.graph.getZoom();
      const newZoom = Math.max(currentZoom / ZOOM_STEP, MIN_ZOOM);
      this.graph.zoomTo(newZoom);
      this.setData({scale: newZoom});
    },

    /**
     * Resets the graph zoom and centers the view.
     */
    resetView() {
      if (!this.graph) {
        return;
      }
      this.graph.zoomTo(1);
      this.graph.fitView();
      this.setData({scale: 1});
    },
  },
});
