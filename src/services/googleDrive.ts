const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

/* -----------------------------------------------------------
    SALVAR (Cria se não existir, atualiza se existir)
----------------------------------------------------------- */
export async function saveFileToDrive(
    filename: string,
    data: any,
    accessToken: string
): Promise<void> {
    const boundary = 'boundary_otaku_library';

    // 1. Verificar se o arquivo já existe para obter o ID (apenas arquivos fora da lixeira)
    const listRes = await fetch(
        `${DRIVE_API}?spaces=appDataFolder&q=name='${filename}' and trashed=false&fields=files(id)`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Cache-Control': 'no-cache'
            }
        }
    );

    // Detecção de expiração de Token ou Permissão
    if (listRes.status === 401) throw new Error('TOKEN_EXPIRED');
    if (listRes.status === 403) {
        const errData = await listRes.json();
        console.error("[Google Drive] Erro 403 - Sem permissão:", errData);
        throw new Error('DRIVE_FORBIDDEN');
    }

    const listData = await listRes.json();
    const existingFileId = listData.files?.[0]?.id;

    // 2. Preparar metadados e corpo multipart
    const metadata = {
        name: filename,
        // Só define o parent se for um arquivo novo (POST)
        parents: existingFileId ? undefined : ['appDataFolder'],
    };

    const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        `Content-Type: application/json\r\n\r\n` +
        JSON.stringify(data) +
        `\r\n--${boundary}--`;

    // 3. PATCH para atualizar arquivo existente ou POST para criar novo
    const url = existingFileId
        ? `${UPLOAD_API}/${existingFileId}?uploadType=multipart`
        : `${UPLOAD_API}?uploadType=multipart`;

    const response = await fetch(url, {
        method: existingFileId ? 'PATCH' : 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
    });

    if (response.status === 401) throw new Error('TOKEN_EXPIRED');

    if (!response.ok) {
        const errorBody = await response.json();
        console.error("[Google Drive] Erro ao salvar arquivo:", errorBody);
        throw new Error('DRIVE_SAVE_ERROR');
    }
}

/* -----------------------------------------------------------
    CARREGAR (Download do Backup)
----------------------------------------------------------- */
export async function loadFileFromDrive(
    filename: string,
    accessToken: string
): Promise<any | null> {
    // 1. Localizar o arquivo na pasta oculta do App
    const listRes = await fetch(
        `${DRIVE_API}?spaces=appDataFolder&q=name='${filename}' and trashed=false&fields=files(id)`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Cache-Control': 'no-cache'
            }
        }
    );

    if (listRes.status === 401) throw new Error('TOKEN_EXPIRED');
    if (!listRes.ok) return null;

    const listData = await listRes.json();
    const file = listData.files?.[0];

    if (!file) return null;

    // 2. Baixar o conteúdo binário/JSON do arquivo encontrado
    const fileRes = await fetch(
        `${DRIVE_API}/${file.id}?alt=media`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Cache-Control': 'no-cache'
            }
        }
    );

    if (fileRes.status === 401) throw new Error('TOKEN_EXPIRED');
    if (!fileRes.ok) return null;

    return await fileRes.json();
}

/* -----------------------------------------------------------
    DELETAR (Limpeza de rastro)
----------------------------------------------------------- */
export async function deleteFileFromDrive(fileName: string, token: string): Promise<void> {
    // 1. Busca o ID do arquivo
    const searchUrl = `${DRIVE_API}?q=name='${fileName}' and trashed=false&spaces=appDataFolder`;
    const response = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 401) throw new Error('TOKEN_EXPIRED');

    const data = await response.json();

    if (data.files && data.files.length > 0) {
        const fileId = data.files[0].id;

        // 2. Deleta permanentemente
        const delRes = await fetch(`${DRIVE_API}/${fileId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (delRes.ok) {
            console.log(`[Google Drive] Backup ${fileName} removido.`);
        }
    }
}