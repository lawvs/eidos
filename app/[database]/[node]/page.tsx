import { useEffect } from "react"
import { useParams } from "react-router-dom"

import {
  DataUpdateSignalType,
  EidosDataEventChannelMsg,
  EidosDataEventChannelMsgType,
} from "@/lib/const"
import { useCurrentNode, useNodeMap } from "@/hooks/use-current-node"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useEmoji } from "@/hooks/use-emoji"
import { useNode } from "@/hooks/use-nodes"
import { useSqlite } from "@/hooks/use-sqlite"
import { useUiColumns } from "@/hooks/use-ui-columns"
import { Button } from "@/components/ui/button"
import { DocProperty } from "@/components/doc-property"
import { Editor } from "@/components/doc/editor"
import { FolderTree } from "@/components/folder"
import { Table } from "@/components/table"

import { DefaultColors } from "../../../components/file-selector"
import { NodeCover } from "./node-cover"
import { NodeIconEditor } from "./node-icon"
import { NodeRestore } from "./node-restore"

export const NodeComponent = ({
  nodeId,
  isRootPage,
}: {
  nodeId?: string
  isRootPage?: boolean
}) => {
  const params = useCurrentPathInfo()
  const { updateNodeName } = useSqlite(params.database)
  const { tableName } = params
  const nodeMap = useNodeMap()
  const { updateUiColumns } = useUiColumns(tableName)

  const { getEmoji } = useEmoji()
  const { updateIcon, updateCover, updateHideProperties } = useNode()

  useEffect(() => {
    const handler = (ev: MessageEvent<EidosDataEventChannelMsg>) => {
      const { type, payload } = ev.data
      if (type === EidosDataEventChannelMsgType.DataUpdateSignalType) {
        const { table, _new, _old } = payload
        if (
          [
            DataUpdateSignalType.AddColumn,
            DataUpdateSignalType.UpdateColumn,
          ].includes(payload.type)
        ) {
          switch (payload.type) {
            case DataUpdateSignalType.AddColumn:
            case DataUpdateSignalType.UpdateColumn:
              updateUiColumns(table)
              break
          }
        }
      }
    }
    window.addEventListener("message", handler)
    return () => {
      window.removeEventListener("message", handler)
    }
  }, [updateUiColumns])

  if (isRootPage) {
    return <FolderTree folderId={undefined} />
  }
  if (!nodeId) {
    return null
  }
  const node = nodeMap[nodeId]
  const parentNode = node.parent_id ? nodeMap[node.parent_id] : null
  const handleAddIcon = async () => {
    const emojiNative = await getEmoji(node?.name)
    await updateIcon(node?.id!, emojiNative)
  }
  const handleAddCover = async () => {
    const color =
      DefaultColors[Math.floor(Math.random() * DefaultColors.length)]
    await updateCover(node?.id!, `color://${color}`)
  }

  const toggleProperties = async () => {
    await updateHideProperties(node?.id!, !node?.hide_properties)
  }

  return (
    <>
      <NodeRestore node={node} />
      {node?.type === "table" && (
        <Table tableName={params.tableName!} space={params.database!} />
      )}
      {node?.type === "doc" && (
        <Editor
          isActive
          isEditable={node.is_locked ? false : true}
          docId={node.id}
          title={node.name}
          showTitle
          className={node.is_full_width ? "max-w-full md:!px-12" : ""}
          onTitleChange={(title) => {
            updateNodeName(node.id, title)
          }}
          beforeTitle={
            node.icon && <NodeIconEditor icon={node.icon} nodeId={node.id} />
          }
          coverComponent={node.cover && <NodeCover node={node} />}
          propertyComponent={
            parentNode?.type === "table" &&
            !node.hide_properties && (
              <DocProperty tableId={node.parent_id!} docId={node.id} />
            )
          }
          topComponent={
            <div className="flex h-[28px] cursor-pointer gap-2 opacity-100 hover:opacity-100 sm:opacity-0">
              {!node.icon && (
                <Button size="xs" variant="ghost" onClick={handleAddIcon}>
                  Add Icon
                </Button>
              )}
              {!node.cover && (
                <Button size="xs" variant="ghost" onClick={handleAddCover}>
                  Add Cover
                </Button>
              )}
              {parentNode?.type === "table" && (
                <Button size="xs" variant="ghost" onClick={toggleProperties}>
                  {node.hide_properties ? "Show Properties" : "Hide Properties"}
                </Button>
              )}
            </div>
          }
        />
      )}
      {node?.type === "folder" && <FolderTree folderId={node.id} />}
    </>
  )
}
export default function TablePage() {
  const node = useCurrentNode()
  const { table: nodeId } = useParams()
  return <NodeComponent nodeId={node?.id} isRootPage={nodeId === "~"} />
}
