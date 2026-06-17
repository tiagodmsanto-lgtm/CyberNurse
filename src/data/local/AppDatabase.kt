package com.cybernurse.data.local

import androidx.room.ColumnInfo
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Fts4
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import android.content.Context
import androidx.room.Room
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
/**
 * 1. Data class @Entity para a tabela base 'medicamentos'.
 * A coluna 'rowid' é mapeada explicitamente, pois o FTS se baseia nela.
 */
@Entity(tableName = "medicamentos")
data class Medicamento(
    @PrimaryKey(autoGenerate = true)
    @ColumnInfo(name = "rowid")
    val id: Int = 0,
    val nomeComercial: String,
    val principioAtivo: String,
    val apresentacao: String,
    val codigoEan: String
)

/**
 * 2. Tabela espelho FTS4 para Full-Text Search de altíssimo desempenho.
 * O Room usa o parâmetro contentEntity para ligar esta tabela de busca à tabela original.
 * Isso permite buscas muito rápidas nas colunas de texto especificadas.
 */
@Fts4(contentEntity = Medicamento::class)
@Entity(tableName = "medicamentos_fts")
data class MedicamentoFts(
    @ColumnInfo(name = "nomeComercial")
    val nomeComercial: String,
    @ColumnInfo(name = "principioAtivo")
    val principioAtivo: String
)

/**
 * 3. @Dao (Data Access Object) contendo as funções de busca por texto aproximado.
 */
@Dao
interface MedicamentoDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMedicamentos(medicamentos: List<Medicamento>)

    /**
     * Função de busca rápida usando a sintaxe MATCH.
     * Faz um JOIN entre a tabela real e a tabela virtual FTS usando o rowid.
     */
    @Query("""
        SELECT medicamentos.* 
        FROM medicamentos 
        JOIN medicamentos_fts ON medicamentos.rowid = medicamentos_fts.rowid
        WHERE medicamentos_fts MATCH :query
    """)
    suspend fun searchMedicamentos(query: String): List<Medicamento>

    /**
     * Helper no Kotlin para formatar a query no padrão do FTS (Full-Text Search) 
     * adicionando o curinga "*" para buscas por prefixo.
     * Exemplo: se o usuário digitar "dipi", a query enviada ao MATCH será "dipi*"
     */
    suspend fun searchMedicamentosAproximado(termoBusca: String): List<Medicamento> {
        // Formata para tratar múltiplas palavras (ex: "para ibu" -> "para* ibu*")
        val ftsQuery = termoBusca.trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .joinToString(" ") { "$it*" }
            
        return searchMedicamentos(ftsQuery)
    }
}


/**
 * Configuração do banco de dados Room.
 */
@Database(
    entities = [Medicamento::class, MedicamentoFts::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun medicamentoDao(): MedicamentoDao

    companion object {
        // Singleton para evitar que múltiplas instâncias do banco de dados sejam abertas ao mesmo tempo.
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getInstance(context: Context): AppDatabase {
            // Se a instância já existir, a retorna. Caso contrário, cria a instância.
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "cybernurse_database"
                )
                // Adiciona o callback que escuta o evento de 'onCreate'
                .addCallback(DatabaseCallback(context))
                .build()

                INSTANCE = instance
                instance
            }
        }
    }

    /**
     * Callback para interceptar o momento exato em que o Room cria o banco.
     */
    private class DatabaseCallback(
        private val context: Context
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            // 'onCreate' é disparado apenas 1 vez (quando o arquivo .db não existe e é gerado).
            // A leitura de CSVs grandes não deve rodar aqui diretamente para não travar a UI Thread.
            // Em vez disso, delegamos a tarefa pesada para um Worker do Jetpack.
            val request = OneTimeWorkRequestBuilder<SeedDatabaseWorker>().build()
            WorkManager.getInstance(context).enqueue(request)
        }
    }
}
