<template>
  <o-tooltip :label="expanded">
    {{ shrunk }}
  </o-tooltip>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Term } from 'rdf-js'
import { shrink } from '@/rdf-properties'

export default defineComponent({
  name: 'PropertyDisplay',
  props: {
    term: {
      type: Object as PropType<Term>,
      required: true,
    }
  },

  computed: {
    value (): string {
      return this.term.value || ''
    },

    expanded (): string {
      return this.term.value
    },

    shrunk (): string {
      return shrink(this.value)
    },
  },
})
</script>
