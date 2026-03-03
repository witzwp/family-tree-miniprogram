// components/family-tree/family-tree.js
Component({
  properties: {
    treeData: {
      type: Object,
      value: null,
      observer: 'onTreeDataChange'
    },
    nodeWidth: {
      type: Number,
      value: 200
    },
    nodeHeight: {
      type: Number,
      value: 200
    },
    levelGap: {
      type: Number,
      value: 150
    }
  },

  data: {
    rootNode: null,
    treeWidth: 0,
    treeHeight: 0,
    scale: 1
  },

  methods: {
    // 数据变化时重新计算布局
    onTreeDataChange(newData) {
      if (!newData) return
      
      const layout = this.calculateTreeLayout(newData)
      this.setData({
        rootNode: layout.root,
        treeWidth: layout.width,
        treeHeight: layout.height
      })

      // 绘制连接线
      this.drawLines(layout.root)
    },

    // 计算树形布局
    calculateTreeLayout(node, depth = 0) {
      const { nodeWidth, nodeHeight, levelGap } = this.properties
      
      // 计算当前节点的子树宽度
      let subtreeWidth = 0
      const childLayouts = []

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const childLayout = this.calculateTreeLayout(child, depth + 1)
          childLayouts.push(childLayout)
          subtreeWidth += childLayout.width
        }
      } else {
        subtreeWidth = nodeWidth
      }

      // 当前节点位置
      const x = subtreeWidth / 2
      const y = depth * (nodeHeight + levelGap)

      // 调整子节点位置
      let currentX = 0
      for (const childLayout of childLayouts) {
        childLayout.root.offsetX = currentX + childLayout.width / 2 - x
        currentX += childLayout.width
      }

      return {
        root: {
          ...node,
          x,
          y,
          children: childLayouts.map(c => c.root)
        },
        width: subtreeWidth,
        height: y + nodeHeight + levelGap
      }
    },

    // 绘制连接线
    drawLines(node) {
      // 使用 Canvas 绘制父子之间的连线
      // 这里简化处理，实际项目中使用 Canvas 2D API 绘制贝塞尔曲线
    },

    // 节点点击
    onNodeTap(e) {
      const { id } = e.currentTarget.dataset
      this.triggerEvent('nodetap', { id })
    },

    // 放大
    zoomIn() {
      this.setData({ scale: Math.min(this.data.scale * 1.2, 2) })
    },

    // 缩小
    zoomOut() {
      this.setData({ scale: Math.max(this.data.scale / 1.2, 0.5) })
    },

    // 重置视图
    resetView() {
      this.setData({ scale: 1 })
    }
  }
})
