const DRIVE_API = 'https://www.googleapis.com/drive/v3/files'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files'

/* -----------------------------------------------------------
    SALVAR (Cria se não existir, atualiza se existir)
----------------------------------------------------------- */
export async function saveFileToDrive(
    filename: string,
    data: any,
    accessToken: string
): Promise<void> {
    const boundary = 'boundary_otaku_library'

    // 1. Verificar se o arquivo já existe para obter o ID
    const listRes = await fetch(
        `${DRIVE_API}?spaces=appDataFolder&q=name='${filename}'&fields=files(id)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    // Detecção de Token Expirado
    if (listRes.status === 401) throw new Error('TOKEN_EXPIRED')

    const listData = await listRes.json()
    const existingFileId = listData.files?.[0]?.id

    // 2. Preparar metadados e corpo
    const metadata = {
        name: filename,
        parents: existingFileId ? undefined : ['appDataFolder'],
    }

    const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(data) +
        `\r\n--${boundary}--`

    // 3. PATCH para atualizar ou POST para criar
    const url = existingFileId
        ? `${UPLOAD_API}/${existingFileId}?uploadType=multipart`
        : `${UPLOAD_API}?uploadType=multipart`

    const response = await fetch(url, {
        method: existingFileId ? 'PATCH' : 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
    })

    if (response.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!response.ok) throw new Error('DRIVE_SAVE_ERROR')
}

/* -----------------------------------------------------------
    CARREGAR
----------------------------------------------------------- */
export async function loadFileFromDrive(
    filename: string,
    accessToken: string
): Promise<any | null> {
    const listRes = await fetch(
        `${DRIVE_API}?spaces=appDataFolder&q=name='${filename}'&fields=files(id)`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (listRes.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!listRes.ok) return null

    const listData = await listRes.json()
    const file = listData.files?.[0]
    if (!file) return null

    const fileRes = await fetch(
        `${DRIVE_API}/${file.id}?alt=media`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    if (fileRes.status === 401) throw new Error('TOKEN_EXPIRED')
    if (!fileRes.ok) return null

    return await fileRes.json()
}

/* -----------------------------------------------------------
    DELETAR
----------------------------------------------------------- */
export async function deleteFileFromDrive(fileName: string, token: string) {
    // Primeiro buscamos o ID do arquivo pelo nome
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${fileName}'&spaces=appDataFolder`;
    const response = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();

    if (data.files && data.files.length > 0) {
        const fileId = data.files[0].id;
        // Deletamos o arquivo usando o ID encontrado
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Arquivo de backup deletado do Drive.");
    }
}