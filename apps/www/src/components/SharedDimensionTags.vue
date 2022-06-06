<template>
  <div class="is-flex gap-1">
    <span v-if="dimension.validThrough <= new Date()" class="tag is-warning is-light">
      deprecated
    </span>
    <span v-if="dimension.isExternal" class="tag is-light">
      external
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Dimension } from '@/store/types'

export default defineComponent({
  name: 'SharedDimensionTags',
  props: {
    dimension: {
      type: Object as PropType<Dimension>,
      required: true,
    }
  },
})
</script>
