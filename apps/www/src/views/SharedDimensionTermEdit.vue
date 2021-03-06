<template>
  <side-pane :title="title" @close="onCancel">
    <o-field label="URI" v-if="termUri">
      <a class="form-input" :href="termUri" target="_blank" rel="noopener noreferer">
        <span>{{ termUri }}</span>
        <o-icon icon="external-link-alt" />
      </a>
    </o-field>
    <hydra-operation-form-with-raw
      v-if="resource && operation"
      :operation="operation"
      :resource="resource"
      :shape="shape"
      :error="error"
      :is-submitting="isSubmitting"
      submit-label="Save term"
      @submit="onSubmit"
      @cancel="onCancel"
    />
  </side-pane>
</template>

<script lang="ts">
import { computed, defineComponent, shallowRef, ShallowRef, watch } from 'vue'
import { useStore } from 'vuex'
import { RouteLocation, useRoute, useRouter } from 'vue-router'

import { api } from '@/api'
import HydraOperationFormWithRaw from '@/components/HydraOperationFormWithRaw.vue'
import SidePane from '@/components/SidePane.vue'
import { RootState, DimensionTerm } from '@/store/types'
import { useHydraForm } from '@/use-hydra-form'
import { displayToast } from '@/use-toast'

export default defineComponent({
  name: 'SharedDimensionTermEditView',
  components: { SidePane, HydraOperationFormWithRaw },

  setup () {
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const dimension = store.state.dimension.dimension
    if (!dimension) throw new Error('Dimension not loaded')

    const term: ShallowRef<DimensionTerm | null> = shallowRef(null)
    const termUri = computed(() => term.value?.canonical?.value || term.value?.id.value || null)
    const operation = computed(() => term.value?.actions.replace ?? null)

    const form = useHydraForm(operation, {
      fetchShapeParams: { targetClass: dimension.id },
      saveHeaders: { Prefer: `target-class=${dimension.id.value}` },

      afterSubmit (savedTerm: any) {
        store.dispatch('sharedDimension/updateTerm', savedTerm)

        displayToast({
          message: 'Shared dimension term successfully saved',
          variant: 'success',
        })

        router.push({ name: 'Dimension', params: { id: dimension.clientPath } })
      },
    })

    const fetchTerm = async () => {
      const termId = route.params.termId as string
      term.value = await api.fetchResource<DimensionTerm>(termId)

      form.resource.value = Object.freeze(term.value.pointer)
    }

    watch(route, (newRoute: RouteLocation) => {
      if (newRoute.name === 'SharedDimensionTermEdit') {
        fetchTerm()
      }
    }, { immediate: true })

    watch(term, () => {
      if (term.value) {
        form.resource.value = Object.freeze(term.value.pointer)
      } else {
        form.resource.value = null
      }
    })

    return {
      ...form,
      dimension,
      termUri,
    }
  },

  methods: {
    onCancel (): void {
      this.$router.push({ name: 'Dimension', params: { id: this.dimension.clientPath } })
    },
  },
})
</script>
