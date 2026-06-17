package com.cybernurse.data.local

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader

/**
 * Worker do Jetpack WorkManager responsável por popular o banco de dados Room
 * com os dados do arquivo 'medicamentos_limpos.csv' na primeira vez que o app for aberto.
 */
class SeedDatabaseWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // Obtém a instância do banco
            val database = AppDatabase.getInstance(applicationContext)
            
            // Abre o arquivo CSV da pasta 'assets' (ou res/raw dependendo de onde você o colocou)
            // Assumimos aqui que o arquivo está em src/main/assets/medicamentos_limpos.csv
            val inputStream = applicationContext.assets.open("medicamentos_limpos.csv")
            val reader = BufferedReader(InputStreamReader(inputStream))
            
            // Pula a primeira linha se for o cabeçalho
            val header = reader.readLine()
            
            val medicamentosParaInserir = mutableListOf<Medicamento>()
            
            // Lê o arquivo linha a linha
            reader.forEachLine { line ->
                val tokens = line.split(",") // Adapte se o separador for ';'
                
                // Exemplo de parse seguro:
                if (tokens.size >= 4) {
                    val medicamento = Medicamento(
                        nomeComercial = tokens[0].trim().removeSurrounding("\""),
                        principioAtivo = tokens[1].trim().removeSurrounding("\""),
                        apresentacao = tokens[2].trim().removeSurrounding("\""),
                        codigoEan = tokens[3].trim().removeSurrounding("\"")
                    )
                    medicamentosParaInserir.add(medicamento)
                }
                
                // Realiza a inserção em lotes de 1000 para não estourar a memória RAM
                if (medicamentosParaInserir.size >= 1000) {
                    database.medicamentoDao().insertMedicamentos(medicamentosParaInserir)
                    medicamentosParaInserir.clear()
                }
            }
            
            // Insere o restante
            if (medicamentosParaInserir.isNotEmpty()) {
                database.medicamentoDao().insertMedicamentos(medicamentosParaInserir)
            }
            
            inputStream.close()
            Log.d("SeedDatabaseWorker", "Banco de dados populado com sucesso a partir do CSV.")
            
            Result.success()
        } catch (ex: Exception) {
            Log.e("SeedDatabaseWorker", "Erro ao pré-popular banco de dados", ex)
            Result.failure()
        }
    }
}
