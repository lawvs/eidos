"use client"

import { useEffect, useState } from "react"

import { useCurrentNode } from "@/hooks/use-current-node"
import { useCurrentPathInfo } from "@/hooks/use-current-pathinfo"
import { useSqlite } from "@/hooks/use-sqlite"
import { Editor } from "@/components/doc/editor"
import Grid from "@/components/grid"

export default function TablePage() {
  const params = useCurrentPathInfo()
  const node = useCurrentNode()
  const { updateDoc, getDoc, updateNodeName } = useSqlite(params.database)
  const handleSaveDoc = (content: string) => {
    updateDoc(params.docId!, content)
  }
  const [initContent, setInitContent] = useState<string>("")
  useEffect(() => {
    if (node?.type === "doc") {
      getDoc(params.docId!).then((content) => {
        setInitContent(content)
      })
    }
  }, [getDoc, node?.type, params.docId])

  return (
    <>
      {node?.type === "table" && (
        <Grid tableName={params.tableName!} databaseName={params.space} />
      )}
      {node?.type === "doc" && (
        <Editor
          isEditable
          docId={params.docId!}
          onSave={handleSaveDoc}
          initContent={initContent}
          title={node.name}
          showTitle
          onTitleChange={(title) => {
            updateNodeName(node.id, title)
          }}
        />
      )}
    </>
  )
}
